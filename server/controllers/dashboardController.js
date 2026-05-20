const Client = require('../models/Client');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const Payment = require('../models/Payment');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalClients,
            activeCases,
            totalCases,
            upcomingHearings,
            pendingPayments,
            totalRevenue,
            recentNotifications,
            casesByStatus,
            casesByType,
            monthlyRevenue,
            newClientsThisMonth
        ] = await Promise.all([
            Client.countDocuments({ createdBy: userId }),
            Case.countDocuments({ createdBy: userId, status: { $in: ['Pending', 'Ongoing'] } }),
            Case.countDocuments({ createdBy: userId }),
            Hearing.countDocuments({ createdBy: userId, hearingDate: { $gte: today, $lte: thirtyDaysLater }, result: 'Pending' }),
            Payment.aggregate([{ $match: { createdBy: userId, status: { $in: ['Pending', 'Overdue'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Payment.aggregate([{ $match: { createdBy: userId, status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Notification.find({ userId, isRead: false }).sort('-createdAt').limit(5),
            Case.aggregate([{ $match: { createdBy: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            Case.aggregate([{ $match: { createdBy: userId } }, { $group: { _id: '$caseType', count: { $sum: 1 } } }]),
            Payment.aggregate([
                { $match: { createdBy: userId, status: 'Paid', paidDate: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { year: { $year: '$paidDate' }, month: { $month: '$paidDate' }, day: { $dayOfMonth: '$paidDate' } }, amount: { $sum: '$amount' } } },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]),
            Client.countDocuments({ createdBy: userId, createdAt: { $gte: thirtyDaysAgo } })
        ]);

        // Get upcoming hearings list
        const upcomingHearingsList = await Hearing.find({
            createdBy: userId,
            hearingDate: { $gte: today, $lte: thirtyDaysLater },
            result: 'Pending'
        }).populate({ path: 'caseId', populate: { path: 'clientId', select: 'name phone' } }).sort('hearingDate').limit(5);

        res.status(200).json({
            success: true,
            stats: {
                totalClients,
                activeCases,
                totalCases,
                upcomingHearings,
                pendingPayments: pendingPayments[0]?.total || 0,
                totalRevenue: totalRevenue[0]?.total || 0,
                newClientsThisMonth,
                unreadNotifications: recentNotifications.length
            },
            charts: {
                casesByStatus,
                casesByType,
                monthlyRevenue
            },
            upcomingHearingsList,
            recentNotifications
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };

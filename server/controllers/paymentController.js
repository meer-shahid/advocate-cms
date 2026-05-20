const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// @desc    Get all payments
// @route   GET /api/payments
const getPayments = async (req, res, next) => {
    try {
        const { status, clientId, caseId, page = 1, limit = 10, sort = '-createdAt' } = req.query;
        const query = { createdBy: req.user._id };

        if (status) query.status = status;
        if (clientId) query.clientId = clientId;
        if (caseId) query.caseId = caseId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [payments, total] = await Promise.all([
            Payment.find(query)
                .populate('clientId', 'name phone email')
                .populate('caseId', 'title caseNumber')
                .sort(sort).skip(skip).limit(parseInt(limit)),
            Payment.countDocuments(query)
        ]);

        res.status(200).json({ success: true, count: total, page: parseInt(page), pages: Math.ceil(total / limit), payments });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payment stats
// @route   GET /api/payments/stats
const getPaymentStats = async (req, res, next) => {
    try {
        const stats = await Payment.aggregate([
            { $match: { createdBy: req.user._id } },
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Monthly revenue (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthly = await Payment.aggregate([
            { $match: { createdBy: req.user._id, status: 'Paid', paidDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$paidDate' }, month: { $month: '$paidDate' } },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({ success: true, stats, monthly });
    } catch (error) {
        next(error);
    }
};

// @desc    Create payment
// @route   POST /api/payments
const createPayment = async (req, res, next) => {
    try {
        req.body.createdBy = req.user._id;
        const payment = await Payment.create(req.body);

        if (payment.status === 'Pending') {
            await Notification.create({
                userId: req.user._id,
                title: 'New Invoice Created',
                message: `Invoice ${payment.invoiceNumber} for ₹${payment.amount} is pending payment.`,
                type: 'Payment Due',
                relatedId: payment._id,
                relatedModel: 'Payment'
            });
        }

        res.status(201).json({ success: true, message: 'Payment created successfully.', payment });
    } catch (error) {
        next(error);
    }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
const updatePayment = async (req, res, next) => {
    try {
        if (req.body.status === 'Paid' && !req.body.paidDate) {
            req.body.paidDate = new Date();
        }
        const payment = await Payment.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            req.body,
            { new: true, runValidators: true }
        ).populate('clientId', 'name').populate('caseId', 'title');
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
        res.status(200).json({ success: true, message: 'Payment updated successfully.', payment });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
const deletePayment = async (req, res, next) => {
    try {
        const payment = await Payment.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
        res.status(200).json({ success: true, message: 'Payment deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getPayments, getPaymentStats, createPayment, updatePayment, deletePayment };

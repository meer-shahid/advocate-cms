const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
    try {
        const { isRead, page = 1, limit = 20 } = req.query;
        const query = { userId: req.user._id };
        if (isRead !== undefined) query.isRead = isRead === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
            Notification.countDocuments(query),
            Notification.countDocuments({ userId: req.user._id, isRead: false })
        ]);

        res.status(200).json({ success: true, count: total, unreadCount, notifications });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
        res.status(200).json({ success: true, notification });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(200).json({ success: true, message: 'Notification deleted.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Hearing Reminder', 'Payment Due', 'Case Update', 'New Client', 'System', 'General'],
        default: 'General'
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, trim: true }, // relative URL for navigation
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    relatedModel: { type: String } // 'Case', 'Hearing', 'Payment', etc.
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

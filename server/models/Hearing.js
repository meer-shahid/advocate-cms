const mongoose = require('mongoose');

const hearingSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: [true, 'Case is required']
    },
    hearingDate: {
        type: Date,
        required: [true, 'Hearing date is required']
    },
    hearingTime: { type: String, trim: true },
    courtName: { type: String, trim: true },
    courtRoom: { type: String, trim: true },
    judgeName: { type: String, trim: true },
    purpose: { type: String, trim: true },
    notes: { type: String, trim: true },
    result: {
        type: String,
        enum: ['Pending', 'Adjourned', 'Completed', 'Dismissed', 'Decided'],
        default: 'Pending'
    },
    adjournedReason: { type: String, trim: true },
    nextHearingDate: { type: Date },
    isReminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Hearing', hearingSchema);

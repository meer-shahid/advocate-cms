const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: [true, 'Case is required']
    },
    title: { type: String, trim: true },
    content: {
        type: String,
        required: [true, 'Note content is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['Hearing Update', 'Client Meeting', 'Internal Remark', 'Research Note', 'Action Item', 'General'],
        default: 'General'
    },
    importance: {
        type: String,
        enum: ['Normal', 'Important', 'Critical'],
        default: 'Normal'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);

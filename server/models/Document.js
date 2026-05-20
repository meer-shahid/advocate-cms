const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    filename: {
        type: String,
        required: true,
        trim: true
    },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    category: {
        type: String,
        enum: ['Petition', 'Evidence', 'Affidavit', 'Court Order', 'Agreement', 'ID Proof', 'FIR', 'Notice', 'Other'],
        default: 'Other'
    },
    description: { type: String, trim: true },
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);

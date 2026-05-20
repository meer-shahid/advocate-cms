const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    caseNumber: {
        type: String,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Case title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: { type: String, trim: true },
    caseType: {
        type: String,
        enum: ['Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour', 'Tax', 'Constitutional', 'Other'],
        required: [true, 'Case type is required']
    },
    status: {
        type: String,
        enum: ['Pending', 'Ongoing', 'Closed', 'Won', 'Lost'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'Client is required']
    },
    filingDate: { type: Date },
    nextHearingDate: { type: Date },
    courtName: { type: String, trim: true },
    courtLocation: { type: String, trim: true },
    judgeName: { type: String, trim: true },
    courtCaseNumber: { type: String, trim: true },
    opponentName: { type: String, trim: true },
    opponentLawyer: { type: String, trim: true },
    opponentContact: { type: String, trim: true },
    estimatedFee: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    reliefSought: { type: String, trim: true },
    stage: { type: String, trim: true },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Auto-generate case number
caseSchema.pre('save', async function (next) {
    if (!this.caseNumber) {
        const count = await mongoose.model('Case').countDocuments();
        this.caseNumber = `CASE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Text index for search
caseSchema.index({ title: 'text', caseNumber: 'text', courtName: 'text' });

module.exports = mongoose.model('Case', caseSchema);

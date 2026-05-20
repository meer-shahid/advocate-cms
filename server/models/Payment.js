const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        trim: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'Client is required']
    },
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Overdue', 'Partial'],
        default: 'Pending'
    },
    paymentType: {
        type: String,
        enum: ['Consultation Fee', 'Court Fee', 'Retainer', 'Final Settlement', 'Miscellaneous'],
        default: 'Consultation Fee'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Online'],
        default: 'Cash'
    },
    dueDate: { type: Date },
    paidDate: { type: Date },
    description: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    partialAmount: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Auto-generate invoice number
paymentSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Payment').countDocuments();
        this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);

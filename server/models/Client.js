const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        trim: true,
        required: [true, 'Phone number is required']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    caseType: {
        type: String,
        enum: ['Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour', 'Tax', 'Constitutional', 'Other'],
        default: 'Civil'
    },
    idProofType: { type: String, trim: true },
    idProofNumber: { type: String, trim: true },
    occupation: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Text index for search
clientSchema.index({ name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Client', clientSchema);

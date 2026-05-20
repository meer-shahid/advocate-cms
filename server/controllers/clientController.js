const Client = require('../models/Client');
const Case = require('../models/Case');

// @desc    Get all clients
// @route   GET /api/clients
const getClients = async (req, res, next) => {
    try {
        const { search, caseType, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
        const query = { createdBy: req.user._id };

        if (search) query.$text = { $search: search };
        if (caseType) query.caseType = caseType;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [clients, total] = await Promise.all([
            Client.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
            Client.countDocuments(query)
        ]);

        res.status(200).json({ success: true, count: total, page: parseInt(page), pages: Math.ceil(total / limit), clients });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single client with case history
// @route   GET /api/clients/:id
const getClient = async (req, res, next) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

        const cases = await Case.find({ clientId: req.params.id, createdBy: req.user._id }).sort('-createdAt');
        res.status(200).json({ success: true, client, cases });
    } catch (error) {
        next(error);
    }
};

// @desc    Create client
// @route   POST /api/clients
const createClient = async (req, res, next) => {
    try {
        req.body.createdBy = req.user._id;
        const client = await Client.create(req.body);
        res.status(201).json({ success: true, message: 'Client created successfully.', client });
    } catch (error) {
        next(error);
    }
};

// @desc    Update client
// @route   PUT /api/clients/:id
const updateClient = async (req, res, next) => {
    try {
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
        res.status(200).json({ success: true, message: 'Client updated successfully.', client });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
const deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
        res.status(200).json({ success: true, message: 'Client deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };

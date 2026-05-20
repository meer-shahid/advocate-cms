const Case = require('../models/Case');
const Notification = require('../models/Notification');

// @desc    Get all cases
// @route   GET /api/cases
const getCases = async (req, res, next) => {
    try {
        const { search, status, priority, caseType, clientId, page = 1, limit = 10, sort = '-createdAt' } = req.query;
        const query = { createdBy: req.user._id };

        if (search) query.$text = { $search: search };
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (caseType) query.caseType = caseType;
        if (clientId) query.clientId = clientId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [cases, total] = await Promise.all([
            Case.find(query).populate('clientId', 'name phone email').sort(sort).skip(skip).limit(parseInt(limit)),
            Case.countDocuments(query)
        ]);

        res.status(200).json({ success: true, count: total, page: parseInt(page), pages: Math.ceil(total / limit), cases });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single case
// @route   GET /api/cases/:id
const getCase = async (req, res, next) => {
    try {
        const caseDoc = await Case.findOne({ _id: req.params.id, createdBy: req.user._id })
            .populate('clientId', 'name phone email address')
            .populate('assignedTo', 'name email');
        if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });
        res.status(200).json({ success: true, case: caseDoc });
    } catch (error) {
        next(error);
    }
};

// @desc    Create case
// @route   POST /api/cases
const createCase = async (req, res, next) => {
    try {
        req.body.createdBy = req.user._id;
        const caseDoc = await Case.create(req.body);

        // Create notification
        await Notification.create({
            userId: req.user._id,
            title: 'New Case Filed',
            message: `Case "${caseDoc.title}" (${caseDoc.caseNumber}) has been created.`,
            type: 'Case Update',
            relatedId: caseDoc._id,
            relatedModel: 'Case'
        });

        res.status(201).json({ success: true, message: 'Case created successfully.', case: caseDoc });
    } catch (error) {
        next(error);
    }
};

// @desc    Update case
// @route   PUT /api/cases/:id
const updateCase = async (req, res, next) => {
    try {
        const caseDoc = await Case.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            req.body,
            { new: true, runValidators: true }
        ).populate('clientId', 'name phone email');
        if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });
        res.status(200).json({ success: true, message: 'Case updated successfully.', case: caseDoc });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
const deleteCase = async (req, res, next) => {
    try {
        const caseDoc = await Case.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });
        res.status(200).json({ success: true, message: 'Case deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCases, getCase, createCase, updateCase, deleteCase };

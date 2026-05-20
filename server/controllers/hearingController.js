const Hearing = require('../models/Hearing');
const Case = require('../models/Case');
const Notification = require('../models/Notification');

// @desc    Get all hearings
// @route   GET /api/hearings
const getHearings = async (req, res, next) => {
    try {
        const { caseId, start, end, result, page = 1, limit = 20 } = req.query;
        const query = { createdBy: req.user._id };

        if (caseId) query.caseId = caseId;
        if (result) query.result = result;
        if (start || end) {
            query.hearingDate = {};
            if (start) query.hearingDate.$gte = new Date(start);
            if (end) query.hearingDate.$lte = new Date(end);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [hearings, total] = await Promise.all([
            Hearing.find(query).populate('caseId', 'title caseNumber clientId').sort('hearingDate').skip(skip).limit(parseInt(limit)),
            Hearing.countDocuments(query)
        ]);

        res.status(200).json({ success: true, count: total, hearings });
    } catch (error) {
        next(error);
    }
};

// @desc    Get upcoming hearings (next 30 days)
// @route   GET /api/hearings/upcoming
const getUpcomingHearings = async (req, res, next) => {
    try {
        const today = new Date();
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        const hearings = await Hearing.find({
            createdBy: req.user._id,
            hearingDate: { $gte: today, $lte: thirtyDaysLater },
            result: 'Pending'
        })
            .populate({ path: 'caseId', populate: { path: 'clientId', select: 'name phone' } })
            .sort('hearingDate')
            .limit(10);

        res.status(200).json({ success: true, hearings });
    } catch (error) {
        next(error);
    }
};

// @desc    Create hearing
// @route   POST /api/hearings
const createHearing = async (req, res, next) => {
    try {
        req.body.createdBy = req.user._id;
        const hearing = await Hearing.create(req.body);

        // Update case's next hearing date
        if (req.body.hearingDate) {
            await Case.findByIdAndUpdate(req.body.caseId, { nextHearingDate: req.body.hearingDate });
        }

        // Create notification for hearing reminder
        await Notification.create({
            userId: req.user._id,
            title: 'Hearing Scheduled',
            message: `A hearing has been scheduled for ${new Date(req.body.hearingDate).toLocaleDateString()}.`,
            type: 'Hearing Reminder',
            relatedId: hearing._id,
            relatedModel: 'Hearing'
        });

        res.status(201).json({ success: true, message: 'Hearing scheduled successfully.', hearing });
    } catch (error) {
        next(error);
    }
};

// @desc    Update hearing
// @route   PUT /api/hearings/:id
const updateHearing = async (req, res, next) => {
    try {
        const hearing = await Hearing.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!hearing) return res.status(404).json({ success: false, message: 'Hearing not found.' });
        res.status(200).json({ success: true, message: 'Hearing updated successfully.', hearing });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete hearing
// @route   DELETE /api/hearings/:id
const deleteHearing = async (req, res, next) => {
    try {
        const hearing = await Hearing.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!hearing) return res.status(404).json({ success: false, message: 'Hearing not found.' });
        res.status(200).json({ success: true, message: 'Hearing deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getHearings, getUpcomingHearings, createHearing, updateHearing, deleteHearing };

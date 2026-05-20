const Note = require('../models/Note');

// @desc    Get notes for a case
// @route   GET /api/notes/:caseId
const getNotes = async (req, res, next) => {
    try {
        const notes = await Note.find({ caseId: req.params.caseId, createdBy: req.user._id })
            .populate('createdBy', 'name')
            .sort('-createdAt');
        res.status(200).json({ success: true, notes });
    } catch (error) {
        next(error);
    }
};

// @desc    Create note
// @route   POST /api/notes
const createNote = async (req, res, next) => {
    try {
        req.body.createdBy = req.user._id;
        const note = await Note.create(req.body);
        await note.populate('createdBy', 'name');
        res.status(201).json({ success: true, message: 'Note added successfully.', note });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
const deleteNote = async (req, res, next) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
        res.status(200).json({ success: true, message: 'Note deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotes, createNote, deleteNote };

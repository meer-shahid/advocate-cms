const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');

// @desc    Upload document
// @route   POST /api/documents/upload
const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file.' });
        }

        const { caseId, clientId, category, description } = req.body;
        const document = await Document.create({
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            category: category || 'Other',
            description,
            caseId: caseId || undefined,
            clientId: clientId || undefined,
            uploadedBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Document uploaded successfully.', document });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all documents
// @route   GET /api/documents
const getDocuments = async (req, res, next) => {
    try {
        const { caseId, clientId, category, page = 1, limit = 12 } = req.query;
        const query = { uploadedBy: req.user._id };

        if (caseId) query.caseId = caseId;
        if (clientId) query.clientId = clientId;
        if (category) query.category = category;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [documents, total] = await Promise.all([
            Document.find(query)
                .populate('caseId', 'title caseNumber')
                .populate('clientId', 'name')
                .sort('-createdAt').skip(skip).limit(parseInt(limit)),
            Document.countDocuments(query)
        ]);

        res.status(200).json({ success: true, count: total, pages: Math.ceil(total / limit), documents });
    } catch (error) {
        next(error);
    }
};

// @desc    Download document
// @route   GET /api/documents/:id/download
const downloadDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, uploadedBy: req.user._id });
        if (!document) return res.status(404).json({ success: false, message: 'Document not found.' });

        const filePath = path.resolve(document.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server.' });
        }

        res.download(filePath, document.originalName);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, uploadedBy: req.user._id });
        if (!document) return res.status(404).json({ success: false, message: 'Document not found.' });

        // Delete physical file
        const filePath = path.resolve(document.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await document.deleteOne();
        res.status(200).json({ success: true, message: 'Document deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadDocument, getDocuments, downloadDocument, deleteDocument };

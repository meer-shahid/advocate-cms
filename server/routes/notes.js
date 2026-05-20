const express = require('express');
const router = express.Router();
const { getNotes, createNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:caseId', getNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

module.exports = router;

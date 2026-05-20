const express = require('express');
const router = express.Router();
const { getCases, getCase, createCase, updateCase, deleteCase } = require('../controllers/caseController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getCases);
router.post('/', createCase);
router.get('/:id', getCase);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);

module.exports = router;

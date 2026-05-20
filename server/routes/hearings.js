const express = require('express');
const router = express.Router();
const { getHearings, getUpcomingHearings, createHearing, updateHearing, deleteHearing } = require('../controllers/hearingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/upcoming', getUpcomingHearings);
router.get('/', getHearings);
router.post('/', createHearing);
router.put('/:id', updateHearing);
router.delete('/:id', deleteHearing);

module.exports = router;

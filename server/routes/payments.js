const express = require('express');
const router = express.Router();
const { getPayments, getPaymentStats, createPayment, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getPaymentStats);
router.get('/', getPayments);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

module.exports = router;

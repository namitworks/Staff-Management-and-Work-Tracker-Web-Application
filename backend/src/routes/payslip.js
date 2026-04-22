const express = require('express');
const router = express.Router();
const {
  generatePayslip,
  getPayslip,
  getPayslipsByStaff,
  deletePayslip
} = require('../controllers/payslipController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/generate', requireRole('admin', 'team_lead'), generatePayslip);
router.get('/:id', getPayslip);
router.get('/staff/:userId', getPayslipsByStaff);
router.delete('/:id', requireRole('admin'), deletePayslip);

module.exports = router;
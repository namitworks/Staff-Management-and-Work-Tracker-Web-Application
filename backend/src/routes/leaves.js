const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  cancelLeave
} = require('../controllers/leaveController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', applyLeave);
router.get('/', getLeaves);
router.get('/balance/:userId', getLeaveBalance);
router.get('/:id', getLeaveById);
router.put('/:id/approve', requireRole('admin'), approveLeave);
router.put('/:id/reject', requireRole('admin'), rejectLeave);
router.put('/:id/cancel', cancelLeave);

module.exports = router;

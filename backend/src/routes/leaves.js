const express = require('express');
const router = express.Router();
const { applyLeave, getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', applyLeave);
router.get('/', getAllLeaves);
router.put('/:id/status', requireRole('admin', 'team_lead'), updateLeaveStatus);

module.exports = router;

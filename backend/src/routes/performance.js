const express = require('express');
const router = express.Router();
const { addPerformanceRecord, getPerformanceByUserId } = require('../controllers/performanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('admin'), addPerformanceRecord);
router.get('/:userId', getPerformanceByUserId);

module.exports = router;

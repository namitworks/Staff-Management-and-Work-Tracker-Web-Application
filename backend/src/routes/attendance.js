const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getTodayStatus, getAttendanceHistory } = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/today', getTodayStatus);
router.get('/history/:userId', getAttendanceHistory);

module.exports = router;

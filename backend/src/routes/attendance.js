const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceByUser,
  getAttendanceSummary,
  getMonthlyReport
} = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/today', getTodayAttendance);
router.get('/user/:userId', getAttendanceByUser);
router.get('/summary/:userId', getAttendanceSummary);
router.get('/report', requireRole('admin'), getMonthlyReport);

module.exports = router;

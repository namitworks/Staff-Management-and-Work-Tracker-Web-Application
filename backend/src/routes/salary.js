const express = require('express');
const router = express.Router();
const { addSalaryRecord, getSalaryByUserId, updateSalaryStatus } = require('../controllers/salaryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('admin'), addSalaryRecord);
router.get('/:userId', getSalaryByUserId);
router.put('/:id', requireRole('admin'), updateSalaryStatus);

module.exports = router;

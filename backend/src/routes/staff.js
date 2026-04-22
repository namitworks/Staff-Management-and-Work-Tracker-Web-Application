const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { 
  getAllStaff, 
  getStaffById, 
  createStaff, 
  updateStaff, 
  deleteStaff,
  uploadAvatar
} = require('../controllers/staffController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
      error: 'VALIDATION_FAILED'
    });
  }
  next();
};

const staffValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required'),
  validate
];

// Routes
router.get('/', verifyToken, requireRole('admin', 'team_lead'), getAllStaff);
router.get('/:id', verifyToken, getStaffById);
router.post('/', verifyToken, requireRole('admin'), staffValidation, createStaff);
router.put('/:id', verifyToken, updateStaff);
router.post('/:id/avatar', verifyToken, requireRole('admin'), upload.single('avatar'), uploadAvatar);
router.delete('/:id', verifyToken, requireRole('admin'), deleteStaff);

module.exports = router;

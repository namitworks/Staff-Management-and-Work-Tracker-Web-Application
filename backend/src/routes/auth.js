const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { login, refresh, logout, me, updateProfile, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Validation middleware generator
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

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate
];

// Routes
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, me);
router.put('/update-profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;

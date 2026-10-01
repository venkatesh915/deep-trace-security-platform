const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateRegister } = require('../validators/authValidator');
const authenticateToken = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public endpoints
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/register', authLimiter, validateRegister, authController.register);

// Protected endpoint
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

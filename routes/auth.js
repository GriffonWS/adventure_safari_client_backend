const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Register user
router.post('/register', authController.register);

// Verify email
router.get("/verify-email/:token", authController.verifyEmail)

// Login user
router.post('/login', authController.login);

// Resend verification email
router.post("/resend-verification", authController.resendVerification)


router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Existing auth routes
router.post('/register', authController.register);
router.get("/verify-email/:token", authController.verifyEmail);
router.post('/login', authController.login);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// New 2FA routes
router.post('/verify-2fa', authController.verify2FA);
router.post('/2fa/generate-secret', authMiddleware, authController.generate2FASecret);
router.post('/2fa/enable', authMiddleware, authController.enable2FA);
router.post('/2fa/disable', authMiddleware, authController.disable2FA);
router.get('/2fa/status', authMiddleware, authController.get2FAStatus);

module.exports = router;
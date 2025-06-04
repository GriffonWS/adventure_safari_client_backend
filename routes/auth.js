const express = require('express');
const passport = require('passport');
const router = express.Router();
const { generateToken } = require('../utils/jwt');
const { getCurrentUser } = require('../controller/authController');
const { isAuthenticated } = require('../middleware/auth');

// 1. Google Auth Initiation (Both versions work the same)
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// 2. Google Callback (Hybrid Approach)
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  (req, res) => {
    // Generate JWT
    const token = generateToken(req.user);
    
    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Redirect to appropriate portal
    res.redirect(process.env.CLIENT_URL);
  }
);

// 3. Current User Endpoint (Works with JWT)
router.get('/me', isAuthenticated, getCurrentUser);

// 4. Logout 
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out' });
});

module.exports = router;
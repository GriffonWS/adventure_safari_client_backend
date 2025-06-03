const express = require('express');
const passport = require('passport');
const router = express.Router();
require("dotenv").config()


const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"


// 1️⃣ - Initiate Google OAuth login/signup
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// 2️⃣ - Handle Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    successRedirect: process.env.CLIENT_URL
  })
);


// 3️⃣ - Check login current user
router.get('/current_user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Return only necessary user data
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    picture: req.user.picture
  });
});


// 4️⃣ - Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect(CLIENT_URL);
  });
});

module.exports = router;
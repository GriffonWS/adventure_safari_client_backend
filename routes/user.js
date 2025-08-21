const express = require("express")
const userController = require("../controllers/userController")
const auth = require("../middleware/auth")
const passportUploadMiddleware = require("../middleware/passportUpload")

const router = express.Router()

// Get user profile
router.get("/get-profile", auth, userController.getProfile)


// Update user profile
router.put("/update-profile", auth, userController.updateProfile)

// Change password
router.put("/change-password", auth, userController.changePassword)

// Delete user account
router.delete("/delete-account", auth, userController.deleteUserAccount)

// Complete registration payment (dummy)
router.post("/complete-registration-payment", auth, userController.completeRegistrationPayment)

// Complete password upload
router.post('/complete-password-upload', 
  auth, 
  passportUploadMiddleware, 
  userController.completePasswordUpload
);

module.exports = router
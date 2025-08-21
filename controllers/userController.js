const User = require("../models/User")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { sendVerificationEmail } = require("../utils/emailService")
const { cloudinary } = require("../config/cloudinary")

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.body?.email
    if (!userEmail) {
      return res.status(400).json({ message: "Authenticated user email not found" })
    }

    const user = await User.findOne({ email: userEmail }).select("-password -verificationToken -resetPasswordToken")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error while fetching profile" })
  }
}

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body
    const userEmail = req.user?.email || req.body?.email

    // Validate input
    if (!name && !email) {
      return res.status(400).json({ message: "Please provide at least one field to update" })
    }

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    let emailChanged = false
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use" })
      }

      // If email is changed, require re-verification
      user.email = email
      user.isVerified = false
      user.verificationToken = crypto.randomBytes(32).toString("hex")
      emailChanged = true

      // Send verification email for new email
      try {
        await sendVerificationEmail(email, user.verificationToken)
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
        return res.status(500).json({ message: "Failed to send verification email to new address" })
      }
    }

    if (name) {
      user.name = name
    }

    await user.save()

    const updatedUser = await User.findOne({ email: user.email }).select("-password -verificationToken -resetPasswordToken")

    res.json({
      message: emailChanged
        ? "Profile updated successfully. Please verify your new email address."
        : "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error while updating profile" })
  }
}

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userEmail = req.user?.email || req.body?.email

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" })
    }

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Server error while changing password" })
  }
}

// Delete user account
exports.deleteUserAccount = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.body?.email

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Delete passport from cloudinary if exists
    if (user.passport?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.passport.public_id)
      } catch (cloudinaryError) {
        console.error("Error deleting passport from Cloudinary:", cloudinaryError)
        // Don't fail the account deletion if cloudinary deletion fails
      }
    }

    await User.findByIdAndDelete(user._id)

    res.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Delete account error:", error)
    res.status(500).json({ message: "Server error while deleting account" })
  }
}

// Mark registration payment complete (temporary dummy endpoint)
exports.completeRegistrationPayment = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.body?.email

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.isRegistrationPayment = true
    await user.save()

    return res.json({ success: true, message: "Registration payment marked as complete" })
  } catch (error) {
    console.error("Complete registration payment error:", error)
    return res.status(500).json({ message: "Server error while completing registration payment" })
  }
}

// Mark passport upload complete with file upload
exports.completePasswordUpload = async (req, res) => {
  try {
    const userEmail = req.user?.email || req.body?.email

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Delete previous passport from cloudinary if exists
    if (user.passport?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.passport.public_id)
      } catch (cloudinaryError) {
        console.error("Error deleting old passport from Cloudinary:", cloudinaryError)
        // Continue with the upload even if old file deletion fails
      }
    }

    // Update user with new passport information
    user.passport = {
      url: req.file.path,
      public_id: req.file.public_id,
      uploaded_at: new Date()
    }
    user.isPasswordUpload = true
    
    await user.save()

    return res.json({ 
      success: true, 
      message: "Passport uploaded and registration marked as complete",
      passport: {
        url: user.passport.url,
        uploaded_at: user.passport.uploaded_at
      }
    })
  } catch (error) {
    console.error("Complete passport upload error:", error)
    
    // If there's an error and a file was uploaded, try to clean it up
    if (req.file?.public_id) {
      try {
        await cloudinary.uploader.destroy(req.file.public_id)
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded file:", cleanupError)
      }
    }
    
    return res.status(500).json({ message: "Server error while completing passport upload" })
  }
}
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { sendVerificationEmail } = require("../utils/emailService")



// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -verificationToken -resetPasswordToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body
    const userId = req.userId

    // Validate input
    if (!name && !email) {
      return res.status(400).json({ message: "Please provide at least one field to update" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

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

    const updatedUser = await User.findById(userId).select("-password -verificationToken -resetPasswordToken")

    res.json({
      message:
        email && email !== user.email
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
    const userId = req.userId

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" })
    }

    const user = await User.findById(userId)
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
    const userId = req.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await User.findByIdAndDelete(userId)

    res.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Delete account error:", error)
    res.status(500).json({ message: "Server error while deleting account" })
  }
}



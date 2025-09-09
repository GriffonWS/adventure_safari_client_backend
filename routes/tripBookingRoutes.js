const express = require("express")
const auth = require("../middleware/auth")
const { getAllTrips, createBooking, getAllBookings } = require("../controllers/tripBookingController.js")

const router = express.Router()

// Get all trips (public route - no auth required)
router.get("/trips", getAllTrips)

// Create booking (requires authentication)
router.post("/bookings", auth, createBooking)

// Get all bookings (requires authentication)
router.get("/bookings", auth, getAllBookings)

module.exports = router
const { Booking, Trip } = require("../models/Booking")
const User = require("../models/User")

// Get all trips
exports.getAllTrips = async (req, res) => {
  try {
    const { isActive } = req.query
    
    // Build filter object
    let filter = {}
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }

    const trips = await Trip.find(filter).sort({ createdAt: -1 })

    res.json({
      message: "Trips retrieved successfully",
      trips,
      count: trips.length
    })
  } catch (error) {
    console.error("Get all trips error:", error)
    res.status(500).json({ message: "Server error while fetching trips" })
  }
}

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { tripId, guests } = req.body
    const userEmail = req.user?.email || req.body?.email

    // Validate required fields
    if (!tripId || !guests || !Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ 
        message: "Trip ID and at least one guest are required" 
      })
    }

    // Validate guest data
    for (const guest of guests) {
      if (!guest.name || !guest.age || guest.age < 0) {
        return res.status(400).json({ 
          message: "Each guest must have a valid name and age" 
        })
      }
    }

    // Check if trip exists and is active
    const trip = await Trip.findById(tripId)
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" })
    }

    if (!trip.isActive) {
      return res.status(400).json({ message: "Trip is not available for booking" })
    }

    // Check if user exists
    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Create booking
    const booking = new Booking({
      tripId,
      userId: user._id,
      guests,
      bookingDate: new Date()
    })

    await booking.save()

    // Populate trip and user details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('tripId', 'name destination price image')
      .populate('userId', 'name email')

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({ message: "Server error while creating booking" })
  }
}


exports.getAllBookings = async (req, res) => {
  try {
    const { bookingStatus, paymentStatus } = req.query
    const requestingUserEmail = req.user?.email || req.body?.email

    // Build filter object
    let filter = {}
    
    // Find authenticated user by email
    const user = await User.findOne({ email: requestingUserEmail })
    if (!user) {
      return res.status(404).json({ message: "Authenticated user not found" })
    }
    filter.userId = user._id

    if (bookingStatus) {
      filter.bookingStatus = bookingStatus
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus
    }

    const bookings = await Booking.find(filter)
      .populate('tripId', 'name destination price image')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    res.json({
      message: "Bookings retrieved successfully",
      bookings,
      count: bookings.length
    })
  } catch (error) {
    console.error("Get all bookings error:", error)
    res.status(500).json({ message: "Server error while fetching bookings" })
  }
}
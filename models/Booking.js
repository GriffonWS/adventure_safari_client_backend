const mongoose = require("mongoose");

// Guest Schema
const guestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    registrationPayment: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Trip Schema
const tripSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Booking Schema
const bookingSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    guests: [guestSchema], // Array of guest subdocuments
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Export models
const Guest = mongoose.model("Guest", guestSchema);
const Trip = mongoose.model("Trip", tripSchema);
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
  Guest,
  Trip,
  Booking,
};

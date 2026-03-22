const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  showtimeId: String,
  seats: [String], // ["A1", "A2"]
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
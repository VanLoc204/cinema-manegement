const router = require("express").Router();
const Booking = require("../models/Booking");

// 🎯 lấy ghế đã đặt theo suất chiếu
router.get("/:showtimeId", async (req, res) => {
  const bookings = await Booking.find({
    showtimeId: req.params.showtimeId
  });

  // gom tất cả ghế lại
  const bookedSeats = bookings.flatMap(b => b.seats);

  res.json(bookedSeats);
});
// 🎟️ đặt vé
router.post("/", async (req, res) => {
  const { showtimeId, seats } = req.body;

  // kiểm tra ghế đã bị đặt chưa
  const existing = await Booking.find({
    showtimeId,
    seats: { $in: seats }
  });

  if (existing.length > 0) {
    return res.status(400).json({
      message: "Ghế đã được đặt!"
    });
  }

  const booking = new Booking({
    showtimeId,
    seats
  });

  await booking.save();

  res.json({ message: "Đặt vé thành công" });
});
module.exports = router;
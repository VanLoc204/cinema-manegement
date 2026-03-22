const router = require("express").Router();
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const mongoose = require("mongoose");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware"); // 👮 Import bảo vệ

// 🎯 1. Lấy danh sách ghế (Khách & Admin xem được)
router.get("/:showtimeId", async (req, res) => {
    try {
        const bookings = await Booking.find({ showtimeId: req.params.showtimeId });
        const bookedSeats = bookings.flatMap(b => b.seats);
        res.json(bookedSeats);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách ghế" });
    }
});

// 🎟️ 2. Xác nhận đặt vé (Cần đăng nhập - verifyToken)
router.post("/confirm", verifyToken, async (req, res) => {
    try {
        const { showtimeId, userId, seats, totalAmount } = req.body;
        const existing = await Booking.find({ showtimeId, seats: { $in: seats } });
        if (existing.length > 0) return res.status(400).json({ message: "Ghế đã bị người khác đặt!" });

        const booking = new Booking({ showtimeId, userId, seats, totalAmount, status: "Paid" });
        await booking.save();
        res.json({ message: "Thanh toán thành công!", booking: booking });
    } catch (err) {
        res.status(500).json({ message: "Lỗi lưu hóa đơn" });
    }
});

// 📜 3. Lấy lịch sử vé (Cần đăng nhập - verifyToken)
router.get("/user/:userId", verifyToken, async (req, res) => {
    try {
        const history = await Booking.find({ userId: req.params.userId })
            .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } })
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy lịch sử vé" });
    }
});

// 📊 4. Thống kê doanh thu (🛡️ CHỈ ADMIN)
router.get("/admin/revenue", verifyAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });
        const totalRevenue = bookings.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const totalTickets = bookings.reduce((sum, item) => sum + (item.seats?.length || 0), 0);
        res.json({
            totalRevenue,
            totalTickets,
            history: bookings.sort((a, b) => b.createdAt - a.createdAt)
        });
    } catch (err) {
        res.status(500).json("Lỗi lấy doanh thu");
    }
});

// 📊 5. Dashboard Tổng hợp (🛡️ CHỈ ADMIN)
router.get("/admin/dashboard", verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });
    const totalMovies = await Movie.countDocuments();
    const totalRooms = await Room.countDocuments();

    const totalRevenue = bookings.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalTickets = bookings.reduce((sum, item) => sum + (item.seats?.length || 0), 0);

    const movieSales = {};
    bookings.forEach(b => {
        const title = b.showtimeId?.movieId?.title || "Phim đã xóa";
        movieSales[title] = (movieSales[title] || 0) + b.totalAmount;
    });
    
    const topMovies = Object.entries(movieSales)
        .map(([title, revenue]) => ({ title, revenue }))
        .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    res.json({
        totalRevenue,
        totalTickets,
        totalMovies,
        totalRooms,
        topMovies,
        recentBookings: bookings.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy dữ liệu Dashboard" });
  }
});

module.exports = router;

const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const mongoose = require("mongoose");

// 💺 1. Lấy danh sách ghế (Fix lỗi 500 khi load trang đặt vé)
exports.getOccupiedSeats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID suất chiếu không chuẩn sếp ơi!" });
        }
        const bookings = await Booking.find({ showtimeId: id });
        const bookedSeats = bookings.flatMap(b => b.seats);
        res.json(bookedSeats);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy ghế: " + err.message });
    }
};

// 🎟️ 2. Tạo đơn hàng (ĐÃ THÊM SNACKS ĐỂ KHÔNG BỊ EMPTY)
exports.createBooking = async (req, res) => {
    try {
        // 🔍 Lấy thêm "snacks" từ req.body
        const { showtimeId, userId, seats, snacks, totalAmount } = req.body;

        // Kiểm tra ghế trùng (Double Check)
        const existing = await Booking.find({ showtimeId, seats: { $in: seats } });
        if (existing.length > 0) return res.status(400).json({ message: "Ghế đã bị đặt mất rồi!" });

        // 🍿 Lưu đơn hàng (Bao gồm mảng bắp nước)
        const booking = await Booking.create({
            showtimeId,
            userId,
            seats,
            snacks: snacks || [], 
            totalAmount,
            status: "Paid"
        });

        const fullBooking = await Booking.findById(booking._id)
            .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } });

        res.json({ message: "Thanh toán thành công!", booking: fullBooking });
    } catch (err) {
        res.status(500).json({ message: "Lỗi lưu hóa đơn: " + err.message });
    }
};

// 📜 3. Lịch sử đặt vé
exports.getUserBookings = async (req, res) => {
    try {
        const history = await Booking.find({ userId: req.params.userId })
            .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } })
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy lịch sử" });
    }
};

// 📊 4. Doanh thu
exports.getRevenue = async (req, res) => {
    try {
        const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });
        const totalRevenue = bookings.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const totalTickets = bookings.reduce((sum, item) => sum + (item.seats?.length || 0), 0);
        res.json({ totalRevenue, totalTickets, history: bookings.sort((a, b) => b.createdAt - a.createdAt) });
    } catch (err) { res.status(500).json("Lỗi doanh thu"); }
};

// 📊 5. Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });
        const totalMovies = await Movie.countDocuments();
        const totalRooms = await Room.countDocuments();
        const movieSales = {};
        bookings.forEach(b => {
            const title = b.showtimeId?.movieId?.title || "Phim đã xóa";
            movieSales[title] = (movieSales[title] || 0) + b.totalAmount;
        });
        const topMovies = Object.entries(movieSales).map(([title, revenue]) => ({ title, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        res.json({ totalRevenue: bookings.reduce((sum, i) => sum + i.totalAmount, 0), totalTickets: bookings.reduce((sum, i) => sum + i.seats.length, 0), totalMovies, totalRooms, topMovies, recentBookings: bookings.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5) });
    } catch (err) { res.status(500).json({ message: "Lỗi Dashboard" }); }
};
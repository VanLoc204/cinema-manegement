const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Showtime = require("../models/Showtime"); // ✨ Thêm cái này để lọc theo phim
const mongoose = require("mongoose");

// 💺 1. Lấy danh sách ghế (Giữ nguyên)
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

// 🎟️ 2. Tạo đơn hàng (Giữ nguyên real-time)
exports.createBooking = async (req, res) => {
    try {
        const { showtimeId, userId, seats, snacks, totalAmount } = req.body;
        const existing = await Booking.find({ showtimeId, seats: { $in: seats } });
        if (existing.length > 0) return res.status(400).json({ message: "Ghế đã bị đặt mất rồi!" });

        const booking = await Booking.create({
            showtimeId, userId, seats, snacks: snacks || [], totalAmount, status: "Paid"
        });

        const io = req.app.get("socketio"); 
        if (io) {
            io.emit("cancel-hold-timer", { userId });
            const allBookings = await Booking.find({ showtimeId });
            const allBookedSeats = allBookings.flatMap(b => b.seats);
            io.to(showtimeId).emit("update-booked-seats", allBookedSeats);
        }

        const fullBooking = await Booking.findById(booking._id)
            .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } });

        res.json({ message: "Thanh toán thành công!", booking: fullBooking });
    } catch (err) {
        res.status(500).json({ message: "Lỗi lưu hóa đơn: " + err.message });
    }
};

// 📜 3. Lịch sử đặt vé (Giữ nguyên)
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

// 📊 4. DOANH THU (🔥 ĐÃ NÂNG CẤP BỘ LỌC)
exports.getRevenue = async (req, res) => {
    try {
        const { movieId, date, hasSnack } = req.query; // 📥 Nhận các tham số lọc từ Frontend
        let query = { status: "Paid" };

        // 🟢 A. Lọc theo Phim
        if (movieId) {
            // Tìm các suất chiếu (showtime) thuộc bộ phim này
            const showtimes = await Showtime.find({ movieId });
            const showtimeIds = showtimes.map(s => s._id);
            query.showtimeId = { $in: showtimeIds }; // Chỉ lấy các booking thuộc các suất chiếu đó
        }

        // 🟢 B. Lọc theo Ngày (Từ 00:00 đến 23:59 của ngày sếp chọn)
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        // 🟢 C. Lọc theo Combo (Bắp nước)
        if (hasSnack === "true") {
            query["snacks.0"] = { $exists: true }; // Mảng snacks có ít nhất 1 phần tử
        } else if (hasSnack === "false") {
            query.snacks = { $size: 0 }; // Mảng snacks trống rỗng
        }

        // 🔍 Tìm danh sách đã lọc và tính toán
        const bookings = await Booking.find(query)
            .populate({ path: 'showtimeId', populate: { path: 'movieId' } });

        let totalRevenue = 0;
        let snackRevenue = 0;
        let totalTickets = 0;
        let totalSnacks = 0;

        bookings.forEach(b => {
            totalRevenue += (b.totalAmount || 0);
            totalTickets += (b.seats ? b.seats.length : 0);
            if (b.snacks && b.snacks.length > 0) {
                b.snacks.forEach(s => {
                    snackRevenue += (s.price * s.quantity); 
                    totalSnacks += s.quantity;              
                });
            }
        });

        const ticketRevenue = totalRevenue - snackRevenue;

        res.json({ 
            totalRevenue, 
            ticketRevenue, 
            snackRevenue, 
            totalTickets, 
            totalSnacks, 
            history: bookings.sort((a, b) => b.createdAt - a.createdAt) 
        });
    } catch (err) { 
        console.error("Lỗi báo cáo:", err);
        res.status(500).json({ message: "Lỗi tính toán doanh thu sếp ơi!" }); 
    }
};

// 📊 5. Dashboard (🔥 CẬP NHẬT CẢ BỘ LỌC ĐỂ ĐỒNG BỘ)
exports.getDashboard = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: "Paid" })
            .populate({ path: 'showtimeId', populate: { path: 'movieId' } });
        
        const totalMovies = await Movie.countDocuments();
        const totalRooms = await Room.countDocuments();
        
        let totalRevenue = 0;   
        let snackRevenue = 0;   
        let totalTickets = 0;   
        let totalSnacks = 0;    
        let movieSales = {};    

        bookings.forEach(b => {
            const amount = b.totalAmount || 0;
            totalRevenue += amount;
            totalTickets += (b.seats ? b.seats.length : 0);
            
            if (b.snacks && b.snacks.length > 0) {
                b.snacks.forEach(s => {
                    snackRevenue += (s.price * s.quantity); 
                    totalSnacks += s.quantity;              
                });
            }

            const title = b.showtimeId?.movieId?.title || "Phim đã xóa";
            movieSales[title] = (movieSales[title] || 0) + amount;
        });

        const ticketRevenue = totalRevenue - snackRevenue;
        const topMovies = Object.entries(movieSales)
            .map(([title, revenue]) => ({ title, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const recentBookings = [...bookings]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);

        res.json({ 
            totalRevenue, ticketRevenue, snackRevenue, totalTickets, 
            totalSnacks, totalMovies, totalRooms, topMovies, recentBookings 
        });

    } catch (err) { 
        res.status(500).json({ message: "Lỗi Dashboard sếp ơi!" }); 
    }
};
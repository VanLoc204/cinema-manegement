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

// 🎟️ 2. Tạo đơn hàng (ĐÃ THÊM REAL-TIME)
exports.createBooking = async (req, res) => {
    try {
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

        // 📡 --- PHẦN REAL-TIME MỚI THÊM ---
        const io = req.app.get("socketio"); 
        if (io) {
            const allBookings = await Booking.find({ showtimeId });
            const allBookedSeats = allBookings.flatMap(b => b.seats);
            // Phát tín hiệu cập nhật ghế ngay lập tức
            io.to(showtimeId).emit("update-booked-seats", allBookedSeats);
            console.log(`⚡ [Socket] Đã cập nhật ghế real-time cho suất chiếu: ${showtimeId}`);
        }
        // ---------------------------------

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

// 📊 4. Doanh thu (GIỮ NGUYÊN 100% LOGIC CŨ)
exports.getRevenue = async (req, res) => {
    try {
        const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });

        let totalRevenue = 0;   // Tổng tiền (Vé + Bắp)
        let snackRevenue = 0;   // Tổng tiền Bắp nước
        let totalTickets = 0;   // Tổng số vé
        let totalSnacks = 0;    // Tổng số combo bắp nước

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
        res.status(500).json({ message: "Lỗi tính toán doanh thu sếp ơi!" }); 
    }
};

// 📊 5. Dashboard (GIỮ NGUYÊN 100% LOGIC CŨ)
exports.getDashboard = async (req, res) => {
    try {
        const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });
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
            totalRevenue, 
            ticketRevenue, 
            snackRevenue, 
            totalTickets, 
            totalSnacks, 
            totalMovies, 
            totalRooms, 
            topMovies, 
            recentBookings 
        });

    } catch (err) { 
        console.error("Lỗi Dashboard:", err);
        res.status(500).json({ message: "Lỗi Dashboard sếp ơi!" }); 
    }
};
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

// 📊 4. Doanh thu (ĐÃ NÂNG CẤP BÓC TÁCH CHI TIẾT)
exports.getRevenue = async (req, res) => {
    try {
        const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });

        let totalRevenue = 0;   // Tổng tiền (Vé + Bắp)
        let snackRevenue = 0;   // Tổng tiền Bắp nước
        let totalTickets = 0;   // Tổng số vé
        let totalSnacks = 0;    // Tổng số combo bắp nước

        bookings.forEach(b => {
            // 1. Cộng dồn tổng doanh thu thực tế
            totalRevenue += (b.totalAmount || 0);
            
            // 2. Cộng dồn số lượng vé
            totalTickets += (b.seats ? b.seats.length : 0);

            // 3. Xử lý bóc tách phần bắp nước
            if (b.snacks && b.snacks.length > 0) {
                b.snacks.forEach(s => {
                    snackRevenue += (s.price * s.quantity); // Tiền bắp = giá món x số lượng
                    totalSnacks += s.quantity;              // Tổng số lượng combo
                });
            }
        });

        // 4. Tiền vé = Tổng doanh thu - Tiền bắp nước
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

// 📊 5. Dashboard (Bản nâng cấp bóc tách chi tiết vé và bắp nước)
exports.getDashboard = async (req, res) => {
    try {
        const bookings = await Booking.find().populate({ path: 'showtimeId', populate: { path: 'movieId' } });
        const totalMovies = await Movie.countDocuments();
        const totalRooms = await Room.countDocuments();
        
        // 🧮 Khởi tạo các biến tính toán
        let totalRevenue = 0;   // Tổng (Vé + Bắp)
        let snackRevenue = 0;   // Tổng tiền bắp nước
        let totalTickets = 0;   // Tổng số vé
        let totalSnacks = 0;    // Tổng số combo bắp nước
        let movieSales = {};    // Để tính top phim

        bookings.forEach(b => {
            // 1. Tính tổng doanh thu chung
            const amount = b.totalAmount || 0;
            totalRevenue += amount;

            // 2. Tính tổng số vé
            totalTickets += (b.seats ? b.seats.length : 0);
            
            // 3. Bóc tách tiền bắp nước trong từng đơn hàng
            if (b.snacks && b.snacks.length > 0) {
                b.snacks.forEach(s => {
                    snackRevenue += (s.price * s.quantity); // Tiền bắp = Giá x Số lượng
                    totalSnacks += s.quantity;              // Cộng dồn số lượng combo
                });
            }

            // 4. Gom nhóm doanh thu theo phim (Dùng totalAmount để tính phim hái ra tiền)
            const title = b.showtimeId?.movieId?.title || "Phim đã xóa";
            movieSales[title] = (movieSales[title] || 0) + amount;
        });

        // 5. Tính doanh thu vé thuần túy
        const ticketRevenue = totalRevenue - snackRevenue;

        // 6. Xử lý danh sách Top 5 phim hái ra tiền
        const topMovies = Object.entries(movieSales)
            .map(([title, revenue]) => ({ title, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // 7. Sắp xếp 5 giao dịch mới nhất
        const recentBookings = [...bookings]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);

        // 🚀 Trả về Full bộ chỉ số cho Frontend
        res.json({ 
            totalRevenue, 
            ticketRevenue,   // 🎟️ Mới thêm
            snackRevenue,    // 🍿 Mới thêm
            totalTickets, 
            totalSnacks,     // 🥤 Mới thêm
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
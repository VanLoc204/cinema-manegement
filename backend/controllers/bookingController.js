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
        let query = { status: { $in: ["Paid", "Checked-in"] } };

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

// 📊 5. Dashboard (🔥 CẬP NHẬT CHUẨN ENTERPRISE - AGGREGATION PIPELINE)
exports.getDashboard = async (req, res) => {
    try {
        const totalMovies = await Movie.countDocuments();
        const totalRooms = await Room.countDocuments();

        // 1. NHỜ MONGODB TÍNH TOÁN DỮ LIỆU (Thay vì kéo hết về Node.js)
        const aggregateResult = await Booking.aggregate([
            { $match: { status: { $in: ["Paid", "Checked-in"] } } },
            // JOIN với bảng showtimes
            {
                $lookup: {
                    from: "showtimes",
                    localField: "showtimeId",
                    foreignField: "_id",
                    as: "showtime"
                }
            },
            { $unwind: { path: "$showtime", preserveNullAndEmptyArrays: true } },
            // JOIN với bảng movies để lấy tên phim
            {
                $lookup: {
                    from: "movies",
                    localField: "showtime.movieId",
                    foreignField: "_id",
                    as: "movie"
                }
            },
            { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
            // GOM NHÓM TÍNH TỔNG THEO TỪNG BỘ PHIM
            {
                $group: {
                    _id: { $ifNull: ["$movie.title", "Phim đã xóa"] }, // Nhóm theo tên phim
                    movieRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } }, // Tổng doanh thu phim đó
                    movieTickets: { $sum: { $size: { $ifNull: ["$seats", []] } } }, // Tổng vé
                    // Dùng $reduce để tính tổng tiền bắp nước trong mảng snacks của từng vé
                    movieSnacksRevenue: {
                        $sum: {
                            $reduce: {
                                input: { $ifNull: ["$snacks", []] },
                                initialValue: 0,
                                in: { $add: ["$$value", { $multiply: ["$$this.price", "$$this.quantity"] }] }
                            }
                        }
                    },
                    // Tính tổng số lượng combo đã mua
                    movieSnacksCount: {
                        $sum: {
                            $reduce: {
                                input: { $ifNull: ["$snacks", []] },
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.quantity"] }
                            }
                        }
                    }
                }
            }
        ]);

        // 2. TỔNG HỢP KẾT QUẢ TỪ AGGREGATION (Chỉ chạy lặp đúng 12 lần thay vì 14.000 lần)
        let totalRevenue = 0, snackRevenue = 0, totalTickets = 0, totalSnacks = 0;
        const topMovies = [];

        aggregateResult.forEach(item => {
            totalRevenue += item.movieRevenue;
            totalTickets += item.movieTickets;
            snackRevenue += item.movieSnacksRevenue;
            totalSnacks += item.movieSnacksCount;
            topMovies.push({ title: item._id, revenue: item.movieRevenue });
        });

        const ticketRevenue = totalRevenue - snackRevenue;
        
        // Sắp xếp và lấy 5 phim doanh thu cao nhất
        topMovies.sort((a, b) => b.revenue - a.revenue).splice(5);

        // 3. LẤY 5 GIAO DỊCH GẦN NHẤT (Cực kỳ nhanh vì có limit)
        const recentBookings = await Booking.find({ status: { $in: ["Paid", "Checked-in"] } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'showtimeId', populate: { path: 'movieId' } });

        res.json({
            totalRevenue, ticketRevenue, snackRevenue, totalTickets,
            totalSnacks, totalMovies, totalRooms, topMovies, recentBookings
        });

    } catch (err) {
        console.error("Lỗi Dashboard:", err);
        res.status(500).json({ message: "Lỗi Dashboard sếp ơi!" });
    }
};

// controllers/bookingController.js
exports.getStaffStats = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0); // Đầu ngày
        const end = new Date();
        end.setHours(23, 59, 59, 999); // Cuối ngày

        const bookings = await Booking.find({
            status: { $in: ["Paid", "Checked-in"] },
            createdAt: { $gte: start, $lte: end }
        });

        let totalRevenue = 0, snackRevenue = 0, totalTickets = 0, totalSnacks = 0;

        bookings.forEach(b => {
            totalRevenue += (b.totalAmount || 0);
            totalTickets += (b.seats ? b.seats.length : 0);
            if (b.snacks) {
                b.snacks.forEach(s => {
                    snackRevenue += (s.price * s.quantity);
                    totalSnacks += s.quantity;
                });
            }
        });

        res.json({
            totalRevenue,
            ticketRevenue: totalRevenue - snackRevenue,
            snackRevenue,
            totalTickets,
            totalSnacks
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi tính toán ca trực" });
    }
};

// controllers/bookingController.js
exports.checkInTicket = async (req, res) => {
    try {
        const { id } = req.params; // ID lấy từ mã QR

        const booking = await Booking.findById(id).populate({
            path: 'showtimeId',
            populate: { path: 'movieId roomId' }
        });

        if (!booking) return res.status(404).json({ message: "Không tìm thấy vé này sếp ơi!" });

        if (booking.status === "Checked-in") {
            return res.status(400).json({ message: "Vé này đã được soát trước đó rồi!" });
        }

        // Cập nhật trạng thái
        booking.status = "Checked-in";
        await booking.save();

        res.json({ message: "Soát vé thành công! Mời khách vào phòng.", booking });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống khi soát vé" });
    }
};
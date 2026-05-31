const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Showtime = require("../models/Showtime"); // ✨ Thêm cái này để lọc theo phim
const mongoose = require("mongoose");
const emailService = require("../utils/emailService");
const { PayOS } = require("@payos/node");

// 💳 Khởi tạo PayOS kết nối với các biến môi trường
const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

// 💺 1. Lấy danh sách ghế (Chỉ lấy ghế của đơn hàng Đã thanh toán hoặc Đang chờ)
exports.getOccupiedSeats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID suất chiếu không chuẩn sếp ơi!" });
        }
        // Lọc bỏ các vé đã bị Cancelled để giải phóng ghế
        const bookings = await Booking.find({ showtimeId: id, status: { $ne: "Cancelled" } });
        const bookedSeats = bookings.flatMap(b => b.seats);
        res.json(bookedSeats);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy ghế: " + err.message });
    }
};

// 🎟️ 2. Tạo đơn hàng (Hỗ trợ PayOS tự động)
exports.createBooking = async (req, res) => {
    try {
        const { showtimeId, userId, seats, snacks, totalAmount, appliedVoucher, discountAmount } = req.body;
        console.log("📥 [CONFIRM] Nhận yêu cầu đặt vé từ Client:", { showtimeId, userId, seats, snacks, totalAmount, appliedVoucher });

        // Kiểm tra ghế xem đã bị ai đặt trước chưa (Chỉ bỏ qua các vé đã bị Cancelled)
        const existing = await Booking.find({
            showtimeId,
            seats: { $in: seats },
            status: { $ne: "Cancelled" }
        });
        if (existing.length > 0) return res.status(400).json({ message: "Ghế đã bị đặt mất rồi!" });

        let appliedVoucherQty = 0;
        if (appliedVoucher) {
            const upperCode = appliedVoucher.toUpperCase();
            const tierCodes = {
                "PLAT-SWEETBOX-2D": 4, "PLAT-VIP-2D": 4, "PLAT-STANDARD-2D": 6, "PLAT-BIRTHDAY-COMBO": 2,
                "VIP-SWEETBOX-2D": 2, "VIP-VIP-2D": 2, "VIP-STANDARD-2D": 2, "VIP-BIRTHDAY-COMBO": 1
            };
            if (tierCodes[upperCode]) {
                const usedBookings = await Booking.find({
                    userId,
                    appliedVoucher: upperCode,
                    status: { $in: ["Paid", "Checked-in"] }
                });
                const totalUsed = usedBookings.reduce((sum, b) => sum + (b.appliedVoucherQty || 1), 0);
                const remaining = Math.max(0, tierCodes[upperCode] - totalUsed);
                if (upperCode.includes("BIRTHDAY-COMBO")) {
                    appliedVoucherQty = remaining > 0 ? 1 : 0;
                } else if (upperCode.includes("SWEETBOX-2D")) {
                    const sweetboxCount = seats.filter(sId => sId.charAt(0).toUpperCase() === "I").length;
                    const sweetboxVouchersNeeded = Math.ceil(sweetboxCount / 2);
                    appliedVoucherQty = Math.min(sweetboxVouchersNeeded, remaining);
                } else if (upperCode.includes("VIP-2D")) {
                    const vipCount = seats.filter(sId => ["D", "E", "F", "G"].includes(sId.charAt(0).toUpperCase())).length;
                    appliedVoucherQty = Math.min(vipCount, remaining);
                } else if (upperCode.includes("STANDARD-2D")) {
                    const standardCount = seats.filter(sId => !["D", "E", "F", "G", "I"].includes(sId.charAt(0).toUpperCase())).length;
                    appliedVoucherQty = Math.min(standardCount, remaining);
                } else {
                    appliedVoucherQty = Math.min(seats.length, remaining);
                }
            } else {
                appliedVoucherQty = 1;
            }
        }

        // Tạo mã đơn hàng số duy nhất cho PayOS (phải là số nguyên dương)
        const orderCode = Number(String(Date.now()).slice(-8) + Math.floor(10 + Math.random() * 90));

        const isPaid = req.body.isPaid === true || totalAmount === 0;

        // Lưu thông tin đặt vé vào database với trạng thái ban đầu
        const booking = await Booking.create({
            showtimeId,
            userId,
            seats,
            snacks: snacks || [],
            totalAmount,
            status: isPaid ? "Paid" : "Pending", // Vé 0đ hoặc có gắn isPaid sẽ được đánh dấu Paid luôn
            appliedVoucher,
            discountAmount: discountAmount || 0,
            appliedVoucherQty: appliedVoucher ? (appliedVoucherQty || 1) : 0,
            orderCode: isPaid ? undefined : orderCode
        });

        // 🟢 Trường hợp đặc biệt: Vé miễn phí hoàn toàn hoặc đã được thu tiền (Ví dụ: Tiền mặt tại quầy)
        if (isPaid) {
            // Đánh dấu voucher đã sử dụng ngay lập tức
            if (appliedVoucher) {
                const Voucher = require("../models/Voucher");
                const voucher = await Voucher.findOne({ code: appliedVoucher.toUpperCase() });
                if (voucher) {
                    const userIndex = voucher.assignedUsers.findIndex(
                        au => au.userId.toString() === userId.toString()
                    );
                    if (userIndex !== -1) {
                        voucher.assignedUsers[userIndex].used = true;
                        voucher.assignedUsers[userIndex].usedAt = new Date();
                    } else {
                        voucher.assignedUsers.push({
                            userId,
                            used: true,
                            usedAt: new Date()
                        });
                    }
                    await voucher.save();
                }
            }

            const io = req.app.get("socketio");
            if (io) {
                io.emit("cancel-hold-timer", { userId });
                const allBookings = await Booking.find({ showtimeId, status: { $ne: "Cancelled" } });
                const allBookedSeats = allBookings.flatMap(b => b.seats);
                io.to(showtimeId.toString()).emit("update-booked-seats", allBookedSeats);
            }

            const fullBooking = await Booking.findById(booking._id)
                .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } })
                .populate('userId', 'email name');

            // Gửi email xác nhận
            if (fullBooking && fullBooking.userId && fullBooking.userId.email) {
                emailService.sendBookingConfirmation(fullBooking.userId.email, {
                    bookingId: fullBooking._id,
                    showtime: fullBooking.showtimeId,
                    seats: fullBooking.seats,
                    snacks: fullBooking.snacks,
                    totalAmount: fullBooking.totalAmount,
                    discountAmount: fullBooking.discountAmount,
                    appliedVoucher: fullBooking.appliedVoucher
                }).catch(e => console.error("Email error:", e));
            }

            return res.json({
                message: "Thanh toán thành công! Vé đã được xác nhận.",
                booking: fullBooking,
                isFree: true
            });
        }

        // 🟢 Trường hợp thanh toán thông thường qua PayOS (Tổng tiền > 0)
        // Tạo liên kết thanh toán PayOS
        const paymentData = {
            orderCode: orderCode,
            amount: totalAmount,
            description: `LUXCINEMA ${String(booking._id).slice(-6)}`,
            cancelUrl: `http://localhost:5173/booking/${showtimeId}?status=cancelled&bookingId=${booking._id}`,
            returnUrl: `http://localhost:5173/booking/${showtimeId}?status=success&bookingId=${booking._id}`,
            items: [
                {
                    name: `Vé xem phim ${seats.join(", ")}`,
                    quantity: 1,
                    price: totalAmount
                }
            ]
        };

        console.log("📡 [PAYOS] Đang gọi API PayOS để tạo link thanh toán:", paymentData);
        const paymentLink = await payos.paymentRequests.create(paymentData);
        console.log("📤 [PAYOS] Phản hồi từ PayOS thành công:", paymentLink);

        res.json({
            message: "Đã tạo link thanh toán PayOS!",
            checkoutUrl: paymentLink.checkoutUrl,
            bin: paymentLink.bin,
            accountNumber: paymentLink.accountNumber,
            accountName: paymentLink.accountName,
            booking,
            orderCode
        });

    } catch (err) {
        console.error("Lỗi tạo đơn hàng thanh toán:", err);
        res.status(500).json({ message: "Lỗi tạo đơn hàng: " + err.message });
    }
};

// 🎟️ 2B. Xác thực kết quả thanh toán từ PayOS SDK (Xử lý đồng bộ cực mạnh)
exports.verifyPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ message: "Không tìm thấy hóa đơn này sếp ơi!" });

        // Nếu hóa đơn đã được thanh toán từ trước, trả về thông tin thành công luôn
        if (booking.status === "Paid" || booking.status === "Checked-in") {
            const fullBooking = await Booking.findById(bookingId)
                .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } })
                .populate('userId', 'email name');
            return res.json({ status: "Paid", booking: fullBooking });
        }

        // Tra cứu thông tin giao dịch từ PayOS
        const paymentInfo = await payos.paymentRequests.get(booking.orderCode);

        if (paymentInfo.status === "PAID") {
            // Cập nhật trạng thái trong database
            booking.status = "Paid";
            await booking.save();

            // 🎟️ Đánh dấu voucher đã sử dụng
            if (booking.appliedVoucher) {
                const Voucher = require("../models/Voucher");
                const voucher = await Voucher.findOne({ code: booking.appliedVoucher.toUpperCase() });
                if (voucher) {
                    const userIndex = voucher.assignedUsers.findIndex(
                        au => au.userId.toString() === booking.userId.toString()
                    );
                    if (userIndex !== -1) {
                        voucher.assignedUsers[userIndex].used = true;
                        voucher.assignedUsers[userIndex].usedAt = new Date();
                    } else {
                        voucher.assignedUsers.push({
                            userId: booking.userId,
                            used: true,
                            usedAt: new Date()
                        });
                    }
                    await voucher.save();
                }
            }

            // 📡 Kích hoạt Socket.io gửi cập nhật sơ đồ ghế của phòng chiếu sang các máy khác
            const io = req.app.get("socketio");
            if (io) {
                io.emit("cancel-hold-timer", { userId: booking.userId });
                const allBookings = await Booking.find({ showtimeId: booking.showtimeId, status: { $ne: "Cancelled" } });
                const allBookedSeats = allBookings.flatMap(b => b.seats);
                io.to(booking.showtimeId.toString()).emit("update-booked-seats", allBookedSeats);
            }

            const fullBooking = await Booking.findById(booking._id)
                .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } })
                .populate('userId', 'email name');

            // Gửi email xác nhận chạy ngầm
            if (fullBooking && fullBooking.userId && fullBooking.userId.email) {
                emailService.sendBookingConfirmation(fullBooking.userId.email, {
                    bookingId: fullBooking._id,
                    showtime: fullBooking.showtimeId,
                    seats: fullBooking.seats,
                    snacks: fullBooking.snacks,
                    totalAmount: fullBooking.totalAmount,
                    discountAmount: fullBooking.discountAmount,
                    appliedVoucher: fullBooking.appliedVoucher
                }).catch(e => console.error("Email error:", e));
            }

            return res.json({ status: "Paid", booking: fullBooking });

        } else if (paymentInfo.status === "CANCELLED" || paymentInfo.status === "EXPIRED") {
            booking.status = "Cancelled";
            await booking.save();
            return res.json({ status: "Cancelled", message: "Giao dịch đã bị khách hàng hủy hoặc hết hạn!" });
        } else {
            return res.json({ status: "Pending", message: "Đang chờ khách hàng quét mã thanh toán..." });
        }

    } catch (err) {
        console.error("Lỗi kiểm tra thanh toán:", err);
        res.status(500).json({ message: "Lỗi kiểm tra thanh toán sếp ơi: " + err.message });
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

        if (!booking) return res.status(404).json({ message: "Vé không hợp lệ" });

        if (booking.status === "Checked-in") {
            return res.status(400).json({ message: "Vé đã sử dụng" });
        }

        // Cập nhật trạng thái
        booking.status = "Checked-in";
        await booking.save();

        res.json({ message: "Soát vé thành công! Mời khách vào phòng.", booking });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống khi soát vé" });
    }
};

// 🛑 6. Hủy đơn đặt vé và giải phóng ghế ngay lập tức (Real-time)
exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) return res.status(400).json({ message: "Thiếu Booking ID!" });

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt vé!" });

        // Cập nhật trạng thái thành Cancelled
        booking.status = "Cancelled";
        await booking.save();

        // 🚩 REALTIME: Phát tín hiệu giải phóng ghế qua socket
        const io = req.app.get("socketio");
        if (io) {
            io.emit("cancel-hold-timer", { userId: booking.userId });

            // Lấy lại danh sách ghế đã được đặt chính thức để đồng bộ cho các máy khác
            const allBookings = await Booking.find({ showtimeId: booking.showtimeId, status: { $ne: "Cancelled" } });
            const allBookedSeats = allBookings.flatMap(b => b.seats);
            io.to(booking.showtimeId.toString()).emit("update-booked-seats", allBookedSeats);
        }

        res.json({ message: "Đã hủy đơn hàng và giải phóng ghế thành công!", booking });
    } catch (err) {
        console.error("Lỗi hủy đơn đặt vé:", err);
        res.status(500).json({ message: "Lỗi hệ thống khi hủy vé: " + err.message });
    }
};

// WEBHOOK: Nhận tín hiệu thanh toán tự động từ PayOS
exports.payosWebhook = async (req, res) => {
    try {
        // Xác thực chữ ký checksum từ PayOS (chống giả mạo)
        const webhookData = await payos.webhooks.verify(req.body);
        console.log("[WEBHOOK] Nhận tín hiệu từ PayOS, orderCode:", webhookData.orderCode);

        // code "00" = thanh toán thành công
        if (req.body.code === "00") {
            const booking = await Booking.findOne({ orderCode: webhookData.orderCode });

            if (booking && booking.status === "Pending") {
                booking.status = "Paid";
                await booking.save();
                console.log("[WEBHOOK] Cập nhật Booking", booking._id, "sang Paid thành công!");

                // 🎟️ Đánh dấu voucher đã sử dụng
                if (booking.appliedVoucher) {
                    const Voucher = require("../models/Voucher");
                    const voucher = await Voucher.findOne({ code: booking.appliedVoucher.toUpperCase() });
                    if (voucher) {
                        const userIndex = voucher.assignedUsers.findIndex(
                            au => au.userId.toString() === booking.userId.toString()
                        );
                        if (userIndex !== -1) {
                            voucher.assignedUsers[userIndex].used = true;
                            voucher.assignedUsers[userIndex].usedAt = new Date();
                        } else {
                            voucher.assignedUsers.push({
                                userId: booking.userId,
                                  used: true,
                                  usedAt: new Date()
                            });
                        }
                        await voucher.save();
                        console.log("[WEBHOOK] Đã đánh dấu voucher", booking.appliedVoucher, "được sử dụng!");
                    }
                }

                // 📡 Kích hoạt Socket.io gửi cập nhật sơ đồ ghế của phòng chiếu sang các máy khác
                const io = req.app.get("socketio");
                if (io) {
                    io.emit("cancel-hold-timer", { userId: booking.userId });
                    const allBookings = await Booking.find({ showtimeId: booking.showtimeId, status: { $ne: "Cancelled" } });
                    const allBookedSeats = allBookings.flatMap(b => b.seats);
                    io.to(booking.showtimeId.toString()).emit("update-booked-seats", allBookedSeats);
                }

                // Gửi email xác nhận chạy ngầm
                const fullBooking = await Booking.findById(booking._id)
                    .populate({ path: 'showtimeId', populate: { path: 'movieId roomId' } })
                    .populate('userId', 'email name');

                if (fullBooking && fullBooking.userId && fullBooking.userId.email) {
                    emailService.sendBookingConfirmation(fullBooking.userId.email, {
                        bookingId: fullBooking._id,
                        showtime: fullBooking.showtimeId,
                        seats: fullBooking.seats,
                        snacks: fullBooking.snacks,
                        totalAmount: fullBooking.totalAmount,
                        discountAmount: fullBooking.discountAmount,
                        appliedVoucher: fullBooking.appliedVoucher
                    }).catch(e => console.error("Email error:", e));
                }
            }
        }

        // Bắt buộc phải trả về success để PayOS không retry
        return res.json({ success: true });
    } catch (err) {
        console.error("[WEBHOOK] Lỗi xác thực (checksum sai hoặc dữ liệu không hợp lệ):", err.message);
        return res.json({ success: false });
    }
};
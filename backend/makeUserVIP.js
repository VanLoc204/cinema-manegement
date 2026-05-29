const mongoose = require("mongoose");
require("dotenv").config(); // Load biến môi trường từ .env
const connectDB = require("./config/db");

// Import các model
const User = require("./models/User");
const Booking = require("./models/Booking");
const Showtime = require("./models/Showtime");
const Room = require("./models/Room");
const Movie = require("./models/Movie");

const makeUserVIP = async () => {
    try {
        await connectDB();
        console.log("📡 Đã kết nối MongoDB.");

        // 1. Tìm tài khoản của sếp
        // Mặc định tìm theo tên "Hồ Văn Lộc", nếu không thấy sẽ lấy tài khoản khách hàng đầu tiên
        let user = await User.findOne({ name: "Hồ Văn Lộc" });
        if (!user) {
            user = await User.findOne({ role: "customer" });
        }

        if (!user) {
            console.log("❌ Không tìm thấy tài khoản customer nào trong hệ thống! Vui lòng tạo tài khoản trước sếp ơi.");
            process.exit(1);
        }

        console.log(`👤 Đang tiến hành tạo đơn hàng cho tài khoản: [${user.name}] - [${user.email}]`);

        // 2. Tìm hoặc tạo Suất chiếu (Showtime) mồi để liên kết hóa đơn
        let showtime = await Showtime.findOne();
        if (!showtime) {
            let movie = await Movie.findOne();
            if (!movie) {
                movie = await Movie.create({
                    title: "Phim Bom Tấn LUX",
                    description: "Phim mẫu để test hệ thống",
                    duration: 120,
                    genre: "Hành động",
                    releaseDate: new Date(),
                    image: "/uploads/sample.jpg"
                });
            }

            let room = await Room.findOne();
            if (!room) {
                room = await Room.create({
                    name: "Cinema Hall 1",
                    rows: 9,
                    cols: 12,
                    price: 80000
                });
            }

            showtime = await Showtime.create({
                movieId: movie._id,
                roomId: room._id,
                time: new Date()
            });
        }

        // 3. Xóa các hóa đơn cũ của riêng user này để đảm bảo test mốc 2.500.000đ chuẩn xác 100%
        await Booking.deleteMany({ userId: user._id });
        console.log("🧹 Đã dọn dẹp lịch sử đặt vé cũ của user để test chuẩn mốc.");

        // 4. Tạo đơn đặt vé có giá trị đúng bằng 2.500.000đ
        const newBooking = await Booking.create({
            showtimeId: showtime._id,
            userId: user._id,
            seats: ["A1", "A2", "A3", "A4", "A5"],
            snacks: [
                { snackId: new mongoose.Types.ObjectId(), name: "Premium Popcorn Combo", price: 500000, quantity: 5 }
            ],
            totalAmount: 2500000, // Đúng 2.500.000đ để lên VIP!
            status: "Paid",
            createdAt: new Date() // Năm hiện hành
        });

        console.log("🎟️ Đơn hàng mồi đã được ghi nhận thành công!");
        console.log(`💵 Tổng số tiền thanh toán: 2,500,000 VND`);

        // 5. Kích hoạt tính toán lại ở Backend để đồng bộ tức thì
        console.log("⚙️ Đang đồng bộ hóa thăng hạng ở Backend...");
        
        // Gọi logic tính toán lại giống hệt userController
        const currentYear = new Date().getFullYear();
        const bookings = await Booking.find({ 
            userId: user._id, 
            status: { $in: ["Paid", "Checked-in"] } 
        });

        const totalSpent = bookings
            .filter(t => {
                const ticketDate = t.createdAt ? new Date(t.createdAt) : new Date();
                return ticketDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        let calculatedTier = "NORMAL";
        let pointsRate = 0.05;
        if (totalSpent >= 6000000) {
            calculatedTier = "PLATINUM";
            pointsRate = 0.10;
        } else if (totalSpent >= 2500000) {
            calculatedTier = "VIP";
            pointsRate = 0.07;
        }

        const calculatedPoints = Math.floor(totalSpent * pointsRate);

        // Cập nhật User model làm Single Source of Truth
        await User.findByIdAndUpdate(user._id, {
            membershipTier: calculatedTier,
            yearlySpending: totalSpent,
            luxPoints: calculatedPoints
        });

        console.log("\n========================================================");
        console.log(`🎉 CHÚC MỪNG! HỘI VIÊN [${user.name}] ĐÃ LÊN HẠNG THÀNH CÔNG!`);
        console.log(`🏆 Hạng mới: ${calculatedTier} (VIP)`);
        console.log(`💰 Tổng chi tiêu năm ${currentYear}: ${totalSpent.toLocaleString("vi-VN")} VNĐ`);
        console.log(`⭐ Điểm Lux Club tích lũy: ${calculatedPoints.toLocaleString("vi-VN")} điểm`);
        console.log("========================================================\n");

        mongoose.connection.close();
        console.log("🔌 Đã ngắt kết nối database.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi thực thi script:", err);
        process.exit(1);
    }
};

makeUserVIP();

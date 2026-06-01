const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");

// Import models
const Movie = require("./models/Movie");
const Showtime = require("./models/Showtime");
const Booking = require("./models/Booking");
const Room = require("./models/Room");
const User = require("./models/User");

const cleanAllShowtimesAndBookingsFromJuneFirst = async () => {
    try {
        console.log("==================================================================");
        console.log("🚀 SCRIPT DỌN DẸP TOÀN BỘ SUẤT CHIẾU & ĐƠN ĐẶT VÉ TỪ NGÀY 1/6/2026");
        console.log("==================================================================");

        await connectDB();
        console.log("📡 Đã kết nối MongoDB thành công.");

        // Mốc thời gian từ ngày 1/6/2026 trở đi (UTC+7 Việt Nam)
        const thresholdDate = new Date("2026-06-01T00:00:00+07:00");
        console.log(`📅 Mốc thời gian bắt đầu dọn dẹp: Từ ${thresholdDate.toLocaleString("vi-VN")} trở đi.\n`);

        // 1. Tìm toàn bộ các suất chiếu từ ngày 1/6 trở đi
        const showtimes = await Showtime.find({
            time: { $gte: thresholdDate }
        }).populate("movieId roomId");

        const showtimeIds = showtimes.map(s => s._id);
        console.log(`🔍 Tìm thấy tổng cộng ${showtimes.length} suất chiếu kể từ ngày 1/6 trở đi.`);

        // 2. Tìm toàn bộ đơn đặt vé liên kết với các suất chiếu này HOẶC được tạo từ ngày 1/6 trở đi
        const bookings = await Booking.find({
            $or: [
                { showtimeId: { $in: showtimeIds } },
                { createdAt: { $gte: thresholdDate } }
            ]
        }).populate("userId");

        console.log(`🔍 Tìm thấy tổng cộng ${bookings.length} đơn đặt vé từ ngày 1/6 trở đi (hoặc liên quan đến suất chiếu từ 1/6).\n`);

        // 3. Liệt kê chi tiết danh sách suất chiếu sẽ bị xóa
        if (showtimes.length > 0) {
            console.log("📋 CHI TIẾT CÁC SUẤT CHIẾU SẼ XÓA:");
            showtimes.forEach((s, idx) => {
                console.log(`   [${idx + 1}] Phim: ${s.movieId?.title || "Phim đã bị xóa"} | Phòng: ${s.roomId?.name || "N/A"} | Thời gian: ${new Date(s.time).toLocaleString("vi-VN")}`);
            });
            console.log("");
        }

        // 4. Liệt kê chi tiết danh sách hóa đơn/đơn hàng sẽ bị xóa
        if (bookings.length > 0) {
            console.log("🎟️  CHI TIẾT CÁC ĐƠN ĐẶT VÉ SẼ XÓA:");
            bookings.forEach((b, idx) => {
                console.log(`   [${idx + 1}] Khách hàng: ${b.userId?.name || "Khách vãng lai"} (${b.userId?.email || "N/A"})`);
                console.log(`       Ghế: [${b.seats.join(", ")}] | Tổng tiền: ${b.totalAmount.toLocaleString("vi-VN")}đ | Ngày đặt: ${new Date(b.createdAt).toLocaleString("vi-VN")} | Trạng thái: ${b.status}`);
            });
            console.log("");
        }

        // 5. Tiến hành thực thi xóa nếu có dữ liệu
        let deletedBookingsCount = 0;
        let deletedShowtimesCount = 0;

        if (bookings.length > 0) {
            const bookingDeleteResult = await Booking.deleteMany({
                _id: { $in: bookings.map(b => b._id) }
            });
            deletedBookingsCount = bookingDeleteResult.deletedCount;
            console.log(`🧹 Đã xóa thành công ${deletedBookingsCount} đơn đặt vé khỏi Database.`);
        } else {
            console.log("👉 Không có đơn đặt vé nào cần xóa.");
        }

        if (showtimes.length > 0) {
            const showtimeDeleteResult = await Showtime.deleteMany({
                _id: { $in: showtimeIds }
            });
            deletedShowtimesCount = showtimeDeleteResult.deletedCount;
            console.log(`🧹 Đã xóa thành công ${deletedShowtimesCount} suất chiếu khỏi Database.`);
        } else {
            console.log("👉 Không có suất chiếu nào cần xóa.");
        }

        console.log(`\n==================================================================`);
        console.log("🎉 TỔNG KẾT QUÁ TRÌNH DỌN DẸP TOÀN BỘ:");
        console.log(`❌ Tổng số suất chiếu đã dọn dẹp: ${deletedShowtimesCount}`);
        console.log(`❌ Tổng số đơn đặt vé đã dọn dẹp: ${deletedBookingsCount}`);
        console.log("==================================================================");

        mongoose.connection.close();
        console.log("🔌 Đã ngắt kết nối database an toàn.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi xảy ra trong quá trình dọn dẹp:", err);
        process.exit(1);
    }
};

cleanAllShowtimesAndBookingsFromJuneFirst();

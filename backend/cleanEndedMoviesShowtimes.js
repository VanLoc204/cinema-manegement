const mongoose = require("mongoose");
require("dotenv").config(); // Load variables from .env if present
const connectDB = require("./config/db");

// Import models
const Movie = require("./models/Movie");
const Showtime = require("./models/Showtime");
const Booking = require("./models/Booking");
const Room = require("./models/Room");
const User = require("./models/User");

const cleanEndedMoviesShowtimes = async () => {
    try {
        console.log("==================================================================");
        console.log("🚀 KHỞI CHẠY SCRIPT KIỂM TRA & DỌN DẸP LỊCH CHIẾU/VÉ PHIM ĐÃ NGƯNG");
        console.log("==================================================================");
        
        await connectDB();
        console.log("📡 Đã kết nối MongoDB thành công.");

        // 1. Lấy mốc thời gian từ ngày 1/6/2026 trở đi (múi giờ Việt Nam +07:00)
        const thresholdDate = new Date("2026-06-01T00:00:00+07:00");
        console.log(`📅 Mốc thời gian kiểm tra: Từ ${thresholdDate.toLocaleString("vi-VN")} trở đi.`);

        // 2. Tìm tất cả các phim đã ngưng chiếu (status: "ended")
        const endedMovies = await Movie.find({ status: "ended" });
        console.log(`🎬 Tìm thấy ${endedMovies.length} phim đã ngưng chiếu.`);

        if (endedMovies.length === 0) {
            console.log("✅ Không có phim nào đang ở trạng thái ngưng chiếu (ended). Script dừng tại đây.");
            mongoose.connection.close();
            process.exit(0);
        }

        let totalShowtimesDeleted = 0;
        let totalBookingsDeleted = 0;

        for (const movie of endedMovies) {
            console.log(`\n------------------------------------------------------------------`);
            console.log(`🎥 Phim: [${movie.title}] (ID: ${movie._id})`);

            // 3. Tìm các suất chiếu của phim này từ ngày 1/6/2026 trở đi
            const showtimes = await Showtime.find({
                movieId: movie._id,
                time: { $gte: thresholdDate }
            }).populate("roomId");

            if (showtimes.length === 0) {
                console.log(`👉 Không có suất chiếu nào từ ngày 1/6 trở đi cho phim này.`);
                continue;
            }

            console.log(`🔍 Tìm thấy ${showtimes.length} suất chiếu từ ngày 1/6 trở đi:`);
            const showtimeIds = showtimes.map(s => s._id);

            // 4. Tìm các hóa đơn/đơn đặt vé liên quan đến các suất chiếu này
            const bookings = await Booking.find({
                showtimeId: { $in: showtimeIds }
            }).populate("userId");

            if (bookings.length > 0) {
                console.log(`🎟️  Phát hiện ${bookings.length} đơn đặt vé liên quan:`);
                bookings.forEach((b, idx) => {
                    console.log(`   [${idx + 1}] Khách hàng: ${b.userId?.name || "Khách vãng lai"} (${b.userId?.email || "N/A"})`);
                    console.log(`       Ghế: [${b.seats.join(", ")}] | Tổng tiền: ${b.totalAmount.toLocaleString("vi-VN")}đ | Trạng thái: ${b.status}`);
                });

                // Xóa các đơn đặt vé này
                const bookingDeleteResult = await Booking.deleteMany({
                    showtimeId: { $in: showtimeIds }
                });
                console.log(`🧹 Đã xóa thành công ${bookingDeleteResult.deletedCount} đơn đặt vé.`);
                totalBookingsDeleted += bookingDeleteResult.deletedCount;
            } else {
                console.log(`👉 Không có đơn đặt vé nào liên quan đến các suất chiếu này.`);
            }

            // 5. Xóa các suất chiếu này
            const showtimeDeleteResult = await Showtime.deleteMany({
                _id: { $in: showtimeIds }
            });
            console.log(`🧹 Đã xóa thành công ${showtimeDeleteResult.deletedCount} suất chiếu.`);
            totalShowtimesDeleted += showtimeDeleteResult.deletedCount;
        }

        console.log(`\n==================================================================`);
        console.log("🎉 TỔNG KẾT QUÁ TRÌNH DỌN DẸP:");
        console.log(`❌ Tổng số suất chiếu đã xóa: ${totalShowtimesDeleted}`);
        console.log(`❌ Tổng số đơn đặt vé đã xóa: ${totalBookingsDeleted}`);
        console.log("==================================================================");

        mongoose.connection.close();
        console.log("🔌 Đã ngắt kết nối database an toàn.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi trong quá trình chạy script:", err);
        process.exit(1);
    }
};

cleanEndedMoviesShowtimes();

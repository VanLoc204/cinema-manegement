const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");

const User = require("./models/User");
const Movie = require("./models/Movie");
const Room = require("./models/Room");
const Showtime = require("./models/Showtime");
const Booking = require("./models/Booking");

const trainCurrentAI = async () => {
    try {
        await connectDB();
        console.log("🤖 BẮT ĐẦU CHẠY TIẾN TRÌNH HUẤN LUYỆN AI QUA DỮ LIỆU ĐẶT VÉ GIẢ LẬP...\n");

        // Bước 1: Thu thập tài nguyên hệ thống
        const users = await User.find({ role: "customer" });
        const movies = await Movie.find();
        const rooms = await Room.find();

        if (users.length === 0 || movies.length < 3 || rooms.length === 0) {
            console.log("❌ LỖI: Hệ thống cần ít nhất 1 Khách hàng (User), 3 Bộ phim (Movie) và 1 Phòng chiếu (Room) để chạy huấn luyện.");
            process.exit(1);
        }

        const testUser = users[0];
        const today = new Date();

        // Bước 2: Dọn dẹp các dữ liệu đặt vé giả lập cũ để tránh làm nhiễu quá trình học của AI
        console.log("🧹 Đang dọn dẹp dữ liệu đặt vé giả lập cũ...");
        await Booking.deleteMany({ status: "Paid", seats: { $regex: /^LEARN_/ } });
        console.log("✅ Dọn dẹp hoàn tất!\n");

        // Bước 3: Phân bổ phim vào các Hồ sơ Huấn luyện (Profiles)
        // Chúng ta lấy 3 phim bất kỳ từ danh sách để huấn luyện 3 bài học khác nhau cho AI
        const shuffled = [...movies].sort(() => 0.5 - Math.random());
        const hotMovie = shuffled[0];       // Phim học bài học HOT
        const familyMovie = shuffled[1];    // Phim học bài học Hoạt hình/Gia đình chiếu ban ngày cuối tuần
        const nicheMovie = shuffled[2];     // Phim học bài học Phim Ế

        console.log(`🔥 Phim được huấn luyện thành [SIÊU PHẨM BOM TẤN]: "${hotMovie.title}"`);
        console.log(`🎈 Phim được huấn luyện thành [HOẠT HÌNH GIA ĐÌNH cuối tuần]: "${familyMovie.title}"`);
        console.log(`❄️ Phim được huấn luyện thành [PHIM Ế/ÍT KHÁCH]: "${nicheMovie.title}"\n`);

        // Bước 4: Tạo dữ liệu đặt vé lịch sử trong 30 ngày qua
        console.log("⏳ Đang xây dựng lịch sử mua vé 30 ngày qua để dạy AI...");
        let totalBookingsCreated = 0;

        for (let i = 30; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() - i);
            const isWeekend = (targetDate.getDay() === 0 || targetDate.getDay() === 6); // Thứ 7, Chủ Nhật

            // ----------------------------------------------------
            // KỊCH BẢN 1: Dạy AI nhận diện phim cực HOT (Bơm vé cực đông, đặc biệt là tuần gần đây)
            // Vé mua càng gần ngày hôm nay thì điểm số decayWeight càng cao (nhân hệ số 1.0)
            const hotTicketsMultiplier = i <= 7 ? 80 : 30; // 7 ngày qua mua cực nhiều
            const hotShowtime = await Showtime.create({
                movieId: hotMovie._id,
                roomId: rooms[0]._id,
                time: targetDate,
                isDraft: false
            });

            for (let k = 0; k < hotTicketsMultiplier; k++) {
                await Booking.create({
                    showtimeId: hotShowtime._id,
                    userId: testUser._id,
                    seats: [`LEARN_HOT_${i}_${k}`],
                    totalAmount: 90000,
                    status: "Paid",
                    createdAt: targetDate
                });
                totalBookingsCreated++;
            }

            // ----------------------------------------------------
            // KỊCH BẢN 2: Dạy AI nhận diện Phim Gia đình / Hoạt hình bán chạy ban ngày cuối tuần
            if (isWeekend) {
                // Chỉ bơm vé cho các suất chiếu ban ngày (9h sáng - 4h chiều)
                const familyShowtime = await Showtime.create({
                    movieId: familyMovie._id,
                    roomId: rooms[0]._id,
                    time: new Date(targetDate.setHours(10, 0, 0, 0)), // 10h sáng
                    isDraft: false
                });

                const familyTickets = 50; // Lượng khách gia đình đi đông cuối tuần
                for (let k = 0; k < familyTickets; k++) {
                    await Booking.create({
                        showtimeId: familyShowtime._id,
                        userId: testUser._id,
                        seats: [`LEARN_FAM_${i}_${k}`],
                        totalAmount: 90000,
                        status: "Paid",
                        createdAt: targetDate
                    });
                    totalBookingsCreated++;
                }
            }

            // ----------------------------------------------------
            // KỊCH BẢN 3: Dạy AI nhận diện Phim Ế / Ít khách
            // Chỉ bơm lác đác 1-2 vé trong suốt 30 ngày qua
            const nicheShowtime = await Showtime.create({
                movieId: nicheMovie._id,
                roomId: rooms[0]._id,
                time: targetDate,
                isDraft: false
            });

            const nicheTickets = Math.random() < 0.2 ? 1 : 0; // 20% cơ hội có 1 vé mua thưa thớt
            for (let k = 0; k < nicheTickets; k++) {
                await Booking.create({
                    showtimeId: nicheShowtime._id,
                    userId: testUser._id,
                    seats: [`LEARN_NICHE_${i}_${k}`],
                    totalAmount: 90000,
                    status: "Paid",
                    createdAt: targetDate
                });
                totalBookingsCreated++;
            }
        }

        console.log(`\n🎉 TIẾN TRÌNH HUẤN LUYỆN HOÀN TẤT THÀNH CÔNG!`);
        console.log(`- Đã tạo thành công ${totalBookingsCreated} đơn đặt vé giả lập có quy luật.`);
        console.log(`- AI hiện tại của bạn đã sẵn sàng học tập từ dữ liệu này khi bạn chạy xếp lịch.`);
        console.log(`\n👉 Hướng dẫn chạy thử nghiệm:`);
        console.log(`1. Chạy lệnh: node trainCurrentAI.js`);
        console.log(`2. Lên trang Quản trị, chọn tự động xếp lịch bằng AI.`);
        console.log(`3. AI sẽ tự động xếp Phim Siêu Phẩm kín giờ vàng, và ưu ái Phim Gia Đình vào ban ngày cuối tuần!`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi tiến trình huấn luyện:", error);
        process.exit(1);
    }
};

trainCurrentAI();

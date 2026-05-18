const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");

const User = require("./models/User");
const Movie = require("./models/Movie");
const Room = require("./models/Room");
const Showtime = require("./models/Showtime");
const Booking = require("./models/Booking");

const seedTestAi = async () => {
  try {
    await connectDB();
    console.log("🤖 Đang chạy kịch bản thử nghiệm K-Means theo yêu cầu...");

    const users = await User.find({ role: "customer" });
    const movies = await Movie.find();
    const rooms = await Room.find();

    if (users.length === 0 || movies.length < 3 || rooms.length === 0) {
      console.log("❌ LỖI: Cần ít nhất 1 User, 3 Movie và 1 Room trong Database.");
      process.exit(1);
    }

    // Trộn ngẫu nhiên danh sách phim và chọn 3 phim bất kỳ làm "TOP 3 SIÊU PHẨM PHÒNG VÉ"
    const shuffledMovies = movies.sort(() => 0.5 - Math.random());
    const top3Movies = shuffledMovies.slice(0, 3);
    const user = users[0];

    console.log("🔥 ĐÃ CHỌN RA 3 PHIM LÀM SIÊU PHẨM ĐỂ BƠM VÉ:");
    top3Movies.forEach((m, index) => console.log(`   Top ${index + 1}: ${m.title}`));
    
    // Ngày cần bơm vé: 19/05/2026 và 20/05/2026
    const targetDates = [
      new Date("2026-05-19T00:00:00Z"),
      new Date("2026-05-20T00:00:00Z"),
      new Date("2026-05-21T00:00:00Z"),
      new Date("2026-05-22T00:00:00Z"),
      new Date("2026-05-23T00:00:00Z"),
      new Date("2026-05-24T00:00:00Z")
      
    ];

    let totalBookings = 0;

    for (let targetDate of targetDates) {
      console.log(`\n📅 Đang bơm dữ liệu vé Ảo cho ngày ${targetDate.toLocaleDateString('vi-VN')}...`);
      
      for (let movie of top3Movies) {
        // Mỗi phim chiếu 3 suất một ngày ở các phòng ngẫu nhiên
        for (let j = 0; j < 3; j++) {
          const room = rooms[Math.floor(Math.random() * rooms.length)];
          let time = new Date(targetDate);
          // Ép giờ chiếu: 14:00, 17:00, 20:00
          time.setHours(14 + (j * 3), 0, 0, 0); 
          time.setHours(time.getHours() - 7); // Trừ 7 tiếng để bù giờ UTC khi lưu vào DB

          const showtime = await Showtime.create({
            movieId: movie._id,
            roomId: room._id,
            time: time,
            isDraft: false
          });

          // Bơm khoảng 80-100 vé giả cho MỖI suất chiếu này
          const ticketsToBuy = Math.floor(Math.random() * 20) + 80; 
          for (let k = 0; k < ticketsToBuy; k++) {
            await Booking.create({
              showtimeId: showtime._id,
              userId: user._id,
              seats: [`A${k}`], // Ghế ảo
              totalAmount: 90000,
              status: "Paid",
              // Khách mua vé trước giờ chiếu từ 1-2 ngày
              createdAt: new Date(time.getTime() - Math.random() * 86400000 * 2) 
            });
            totalBookings++;
          }
        }
      }
    }

    console.log(`\n✅ THÀNH CÔNG RỰC RỠ!`);
    console.log(`Đã bơm tổng cộng ${totalBookings} đơn vé vào ngày 19/05 và 20/05 cho 3 phim trên.`);
    console.log(`\n🎯 KỊCH BẢN TEST CHO BẠN BÂY GIỜ LÀ:`);
    console.log(`1. Lên trang Quản lý Suất chiếu.`);
    console.log(`2. Chọn ngày: 21/05/2026 - 21/05/2026.`);
    console.log(`3. Bấm "TỰ ĐỘNG XẾP LỊCH (AI)".`);
    console.log(`=> AI sẽ phải đọc lại dữ liệu của 19 và 20, nhận diện 3 phim trên đang cháy vé, và sẽ ưu ái xếp nó kín màn hình vào ngày 21!`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
};

seedTestAi();

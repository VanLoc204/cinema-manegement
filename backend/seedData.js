const mongoose = require("mongoose");
require("dotenv").config(); // Load biến môi trường từ .env
const connectDB = require("./config/db");

// Import các model cần thiết
const User = require("./models/User");
const Movie = require("./models/Movie");
const Room = require("./models/Room");
const Showtime = require("./models/Showtime");
const Booking = require("./models/Booking");
const Snack = require("./models/Snack");

const seedData = async () => {
  try {
    await connectDB();
    console.log("📡 Đã kết nối MongoDB. Đang bắt đầu tạo dữ liệu mồi...");

    // Lấy dữ liệu nền tảng
    const users = await User.find({ role: "customer" });
    const movies = await Movie.find();
    const rooms = await Room.find();
    const allSnacks = await Snack.find();

    if (users.length === 0 || movies.length === 0 || rooms.length === 0) {
      console.log("❌ LỖI: Vui lòng đảm bảo trong Database có ít nhất 1 User (customer), 1 Movie và 1 Room!");
      process.exit(1);
    }

    // 1. Dọn dẹp Bookings và Showtimes cũ (Cho chắc chắn sạch 100%)
    await Booking.deleteMany({});
    await Showtime.deleteMany({});
    console.log("✅ Đã dọn dẹp sạch sẽ Booking và Showtime cũ.");

    let totalBookingsCreated = 0;
    let totalShowtimesCreated = 0;
    let ticketCounter = {}; // Bộ đếm vé để xếp hạng độ Hot của phim

    // Lặp lùi 7 ngày đến hôm nay
    for (let i = 7; i >= 0; i--) {
      let currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - i);
      const dayOfWeek = currentDate.getDay(); // 0: Chủ Nhật, 6: Thứ 7

      for (let room of rooms) {
        // Mỗi phòng chạy 3 suất/ngày
        const showTimeHours = [10, 15, 20];

        for (let hour of showTimeHours) {
          const randomMovie = movies[Math.floor(Math.random() * movies.length)];
          const time = new Date(currentDate);
          time.setHours(hour, 0, 0, 0);

          // TẠO SUẤT CHIẾU
          const showtime = await Showtime.create({
            movieId: randomMovie._id,
            roomId: room._id,
            time: time
          });
          totalShowtimesCreated++;

          // 🤖 THUẬT TOÁN AI (RULE-BASED): Tính % lấp đầy phòng
          let fillPercentage = 0.15; // Mặc định ngày thường khá vắng (15%)
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            fillPercentage = (Math.floor(Math.random() * 30) + 60) / 100; // T7, CN đông ngẫu nhiên 60-90%
          } else if (dayOfWeek === 5 && hour === 20) {
            fillPercentage = 0.55; // Tối Thứ 6 khá đông (55%)
          }

          // Dựa vào cấu trúc Room.js (mặc định rows: 9, cols: 12)
          const roomRows = room.rows || 9;
          const roomCols = room.cols || 12;
          const totalSeats = roomRows * roomCols;
          const seatsSold = Math.floor(totalSeats * fillPercentage);

          if (seatsSold > 0) {
            // Khởi tạo danh sách ghế (Ví dụ: A1, B2)
            const allAvailableSeats = [];
            const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
            for (let r = 0; r < roomRows; r++) {
              for (let c = 1; c <= roomCols; c++) {
                allAvailableSeats.push(`${rowLabels[r]}${c}`);
              }
            }

            // Trộn ngẫu nhiên (Shuffle) và lấy đủ số lượng bán ra
            const shuffledSeats = allAvailableSeats.sort(() => 0.5 - Math.random());
            const selectedSeats = shuffledSeats.slice(0, seatsSold);

            // Chia số ghế này ra làm các nhóm nhỏ (để mô phỏng việc 1 người mua 1-3 vé)
            let remainingSeats = [...selectedSeats];
            while (remainingSeats.length > 0) {
              const ticketsBought = Math.min(Math.floor(Math.random() * 3) + 1, remainingSeats.length);
              const bookedSeats = remainingSeats.splice(0, ticketsBought);

              const randomUser = users[Math.floor(Math.random() * users.length)];
              let totalAmount = bookedSeats.length * room.price;

              // 🍿 Giả lập mua bắp nước (Khoảng 40% khách hàng sẽ mua)
              let purchasedSnacks = [];
              if (allSnacks.length > 0 && Math.random() > 0.6) {
                const numSnacksToBuy = Math.floor(Math.random() * 2) + 1; // Mua 1-2 loại combo
                for (let s = 0; s < numSnacksToBuy; s++) {
                  const randomSnack = allSnacks[Math.floor(Math.random() * allSnacks.length)];
                  const quantity = Math.floor(Math.random() * 2) + 1; // Mua 1-2 phần mỗi loại

                  // Tránh trùng lặp combo trong 1 vé
                  const existingIndex = purchasedSnacks.findIndex(p => p.snackId === randomSnack._id.toString());
                  if (existingIndex > -1) {
                    purchasedSnacks[existingIndex].quantity += quantity;
                  } else {
                    purchasedSnacks.push({
                      snackId: randomSnack._id.toString(),
                      name: randomSnack.name || "Combo",
                      price: randomSnack.price || 0,
                      quantity: quantity,
                      image: randomSnack.image || ""
                    });
                  }
                  totalAmount += (randomSnack.price || 0) * quantity;
                }
              }

              // Giả lập thời gian khách đặt vé trước giờ chiếu ngẫu nhiên từ 1-24h
              const bookingTime = new Date(time.getTime() - (Math.random() * 86400000));

              // TẠO VÉ (BOOKING)
              await Booking.create({
                showtimeId: showtime._id,
                userId: randomUser._id,
                seats: bookedSeats,
                snacks: purchasedSnacks,
                totalAmount: totalAmount,
                status: "Paid",
                createdAt: bookingTime
              });
              
              // CỘNG DỒN SỐ VÉ BÁN ĐƯỢC CHO PHIM NÀY
              ticketCounter[randomMovie.title] = (ticketCounter[randomMovie.title] || 0) + bookedSeats.length;
              
              totalBookingsCreated++;
            }
          }
        }
      }
    }

    console.log(`\n🎉 HOÀN TẤT SEED DATA! Đã tạo thành công:`);
    console.log(`🎬 ${totalShowtimesCreated} suất chiếu (Showtimes).`);
    console.log(`🎟️ ${totalBookingsCreated} hóa đơn vé (Bookings).`);

    // In ra Bảng xếp hạng 3 phim Hot nhất
    const sortedMovies = Object.entries(ticketCounter).sort((a, b) => b[1] - a[1]);
    console.log(`\n🔥 BẢNG XẾP HẠNG PHIM HOT TRONG 7 NGÀY QUA (Dựa trên lượng vé vừa tạo):`);
    if (sortedMovies[0]) console.log(`   Top 1: ${sortedMovies[0][0]} (${sortedMovies[0][1]} vé)`);
    if (sortedMovies[1]) console.log(`   Top 2: ${sortedMovies[1][0]} (${sortedMovies[1][1]} vé)`);
    if (sortedMovies[2]) console.log(`   Top 3: ${sortedMovies[2][0]} (${sortedMovies[2][1]} vé)`);
    console.log(`\n👉 Bạn hãy lên trang Web, chạy AI Xếp lịch để xem thuật toán K-Means có ưu ái 3 phim này không nhé!\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi hệ thống trong lúc Seed Data:", error);
    process.exit(1);
  }
};

seedData();

const router = require("express").Router();
const Showtime = require("../models/Showtime");
const Room = require("../models/Room"); // 🟢 Bắt buộc phải có để Mongoose hiểu Schema Room
const Movie = require("../models/Movie"); // 🟢 Bắt buộc phải có để Mongoose hiểu Schema Movie
const mongoose = require("mongoose");

// 🕒 1. Lấy tất cả suất chiếu của một bộ phim (Dùng cho trang MovieDetail)
router.get("/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;

    // Kiểm tra ID phim hợp lệ
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "ID phim không hợp lệ" });
    }

    // Lấy suất chiếu và "nhúng" dữ liệu Phòng vào
    const data = await Showtime.find({ 
      movieId: new mongoose.Types.ObjectId(movieId) 
    }).populate("roomId"); 

    // Log để kiểm tra trong Terminal VS Code
    console.log(`🔍 Tìm thấy ${data.length} suất chiếu cho phim ID: ${movieId}`);
    
    res.json(data);
  } catch (err) {
    console.error("🔥 Lỗi tại GET /:movieId:", err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});

// 🎟️ 2. Lấy chi tiết CỤ THỂ một suất chiếu (Dùng cho trang Booking)
router.get("/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID suất chiếu hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID suất chiếu không hợp lệ" });
    }
    
    // ✨ Cực kỳ quan trọng: Populate cả Movie và Room để lấy Title và Room Name
    const showtime = await Showtime.findById(id)
      .populate("movieId") // Để lấy movie.title
      .populate("roomId");  // Để lấy room.name

    if (!showtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu này" });
    }

    res.json(showtime);
  } catch (err) {
    console.error("🔥 Lỗi tại GET /detail/:id:", err);
    res.status(500).json({ message: "Lỗi lấy chi tiết suất chiếu" });
  }
});

module.exports = router;

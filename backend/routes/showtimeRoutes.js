const router = require("express").Router();
const Showtime = require("../models/Showtime");
const Room = require("../models/Room"); 
const Movie = require("../models/Movie"); 
const mongoose = require("mongoose");
const { verifyAdmin } = require("../middleware/authMiddleware"); // 👮 Import "Cảnh sát" bảo vệ

// 🕒 1. Lấy tất cả suất chiếu của một bộ phim (Khách & Admin đều xem được)
router.get("/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(movieId)) return res.status(400).json("ID phim không hợp lệ");

    const data = await Showtime.find({ 
      movieId: new mongoose.Types.ObjectId(movieId) 
    }).populate("roomId"); 
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});

// 🎟️ 2. Lấy chi tiết CỤ THỂ một suất chiếu (Khách & Admin đều xem được)
router.get("/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json("ID không hợp lệ");
    
    const showtime = await Showtime.findById(id).populate("movieId").populate("roomId");
    if (!showtime) return res.status(404).json("Không tìm thấy suất chiếu");

    res.json(showtime);
  } catch (err) {
    res.status(500).json("Lỗi lấy chi tiết suất chiếu");
  }
});

// ➕ 3. THÊM SUẤT CHIẾU MỚI (🛡️ Chỉ Admin)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { movieId, roomId, time } = req.body;
    const newShowtime = new Showtime({ movieId, roomId, time });
    const savedShowtime = await newShowtime.save();
    res.status(201).json(savedShowtime);
  } catch (err) {
    res.status(400).json({ message: "Lỗi tạo suất chiếu", error: err.message });
  }
});

// 🔍 4. LẤY TẤT CẢ SUẤT CHIẾU (🛡️ Chỉ Admin)
router.get("/all/list", verifyAdmin, async (req, res) => {
  try {
    const allShowtimes = await Showtime.find()
      .populate("movieId", "title")
      .populate("roomId", "name price")
      .sort({ time: 1 });
    res.json(allShowtimes);
  } catch (err) {
    res.status(500).json("Lỗi lấy danh sách lịch chiếu");
  }
});

// ❌ 5. XÓA SUẤT CHIẾU (🛡️ Chỉ Admin)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    await Showtime.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa lịch chiếu thành công!" });
  } catch (err) {
    res.status(500).json("Lỗi khi xóa lịch chiếu");
  }
});

// ✏️ 6. CẬP NHẬT SUẤT CHIẾU (🛡️ Chỉ Admin)
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const updatedShowtime = await Showtime.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedShowtime);
  } catch (err) {
    res.status(500).json("Lỗi cập nhật suất chiếu");
  }
});

module.exports = router;

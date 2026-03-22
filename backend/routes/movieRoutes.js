const router = require("express").Router();
const Movie = require("../models/Movie");
const { verifyAdmin } = require("../middleware/authMiddleware"); // 👮 Import "Cảnh sát" bảo vệ

// 🔍 1. Lấy danh sách phim (Dùng cho cả Khách và Admin - Không cần bảo vệ)
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Lỗi kết nối Database", error: err.message });
  }
});

// ➕ 2. Thêm phim mới (🛡️ Chỉ Admin mới được vào)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const newMovie = new Movie(req.body);
    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm phim mới", error: err.message });
  }
});

// ❌ 3. Xóa phim (🛡️ Chỉ Admin mới được vào)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if (!deletedMovie) {
      return res.status(404).json({ message: "Không tìm thấy phim để xóa" });
    }
    res.json({ message: "Đã xóa phim thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa phim", error: err.message });
  }
});

// ✏️ 4. Cập nhật thông tin phim (🛡️ Chỉ Admin mới được vào)
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedMovie);
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật phim", error: err.message });
  }
});

module.exports = router;

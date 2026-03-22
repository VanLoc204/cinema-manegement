const router = require("express").Router();
const Movie = require("../models/Movie"); // Import Model thật

router.get("/", async (req, res) => {
  try {
    // 💡 Lấy tất cả phim từ Database thay vì trả về mảng giả
    const movies = await Movie.find(); 
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Lỗi kết nối Database", error: err });
  }
});

module.exports = router;

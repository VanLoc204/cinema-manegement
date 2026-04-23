const router = require("express").Router();
const showtimeController = require("../controllers/showtimeController");
const { verifyAdmin } = require("../middleware/authMiddleware");

// 🕒 1. Lấy suất chiếu theo phim (Khách & Admin)
router.get("/:movieId", showtimeController.getShowtimesByMovie);

// 🔍 2. Lấy tất cả suất chiếu + Bộ lọc (🛡️ Chỉ Admin)
// Lưu ý: Đặt /all/list lên TRÊN /detail/:id để tránh bị nhầm lẫn route
router.get("/all/list", verifyAdmin, showtimeController.getAllShowtimes);

// 🎟️ 3. Lấy chi tiết cụ thể một suất chiếu
router.get("/detail/:id", showtimeController.getShowtimeDetail);

// ➕ 4. Thêm suất chiếu mới (🛡️ Chỉ Admin)
router.post("/", verifyAdmin, showtimeController.createShowtime);

// ❌ 5. Xóa suất chiếu (🛡️ Chỉ Admin)
router.delete("/:id", verifyAdmin, showtimeController.deleteShowtime);

// ✏️ 6. Cập nhật suất chiếu (🛡️ Chỉ Admin)
router.put("/:id", verifyAdmin, showtimeController.updateShowtime);

module.exports = router;
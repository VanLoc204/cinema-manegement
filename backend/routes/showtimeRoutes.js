const router = require("express").Router();
const showtimeController = require("../controllers/showtimeController");
// Sếp nên có thêm middleware verifyStaff hoặc sửa verifyAdmin để cho phép cả 2 nhé
const { verifyAdmin } = require("../middleware/authMiddleware");

// 🔍 1. Lấy TẤT CẢ suất chiếu (Cho trang POS của nhân viên)
// 🚩 ĐƯA LÊN ĐẦU: Để nó nhận diện / đầu tiên
router.get("/", showtimeController.getAllShowtimes);

// 🔍 2. Lấy danh sách cho Admin (Có bảo mật)
router.get("/all/list", verifyAdmin, showtimeController.getAllShowtimes);

// 🎟️ 3. Lấy chi tiết cụ thể một suất chiếu
router.get("/detail/:id", showtimeController.getShowtimeDetail);

// 🕒 4. Lấy suất chiếu theo phim (Dùng cho trang khách hàng)
// 🚩 ĐƯA XUỐNG DƯỚI: Để tránh "nuốt" mất các route cố định ở trên
router.get("/:movieId", showtimeController.getShowtimesByMovie);

// --- CÁC ROUTE THAY ĐỔI DỮ LIỆU (Chỉ Admin) ---
router.post("/", verifyAdmin, showtimeController.createShowtime);
router.delete("/:id", verifyAdmin, showtimeController.deleteShowtime);
router.put("/:id", verifyAdmin, showtimeController.updateShowtime);

module.exports = router;
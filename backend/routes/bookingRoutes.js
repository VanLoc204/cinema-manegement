const router = require("express").Router();
const bookingController = require("../controllers/bookingController");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");

// 🎯 1. Lấy danh sách ghế đã đặt (Dùng để hiển thị sơ đồ ghế lúc mới load)
// API: GET /api/bookings/:id
router.get("/:id", bookingController.getOccupiedSeats);

// 🎟️ 2. Xác nhận đặt vé (ĐÂY LÀ NƠI KÍCH HOẠT REAL-TIME)
// Khi route này chạy, Controller sẽ gọi Socket để báo cho các máy khác
// API: POST /api/bookings/confirm
router.post("/confirm", verifyToken, bookingController.createBooking);

// 📜 3. Lấy lịch sử vé của User
router.get("/user/:userId", verifyToken, bookingController.getUserBookings);

// 📊 4. Thống kê doanh thu (Chỉ dành cho Admin)
router.get("/admin/revenue", verifyAdmin, bookingController.getRevenue);

// 📊 5. Dashboard Tổng hợp (Chỉ dành cho Admin)
router.get("/admin/dashboard", verifyAdmin, bookingController.getDashboard);

module.exports = router;
const router = require("express").Router();
const bookingController = require("../controllers/bookingController");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");

// 🎯 1. Lấy danh sách ghế đã đặt (Dùng cho SeatMap)
// Frontend gọi: /api/bookings/:showtimeId
router.get("/:id", bookingController.getOccupiedSeats);

// 🎟️ 2. Xác nhận đặt vé (verifyToken bảo vệ)
// Frontend gọi: /api/bookings/confirm
router.post("/confirm", verifyToken, bookingController.createBooking);

// 📜 3. Lấy lịch sử vé của User
router.get("/user/:userId", verifyToken, bookingController.getUserBookings);

// 📊 4. Thống kê doanh thu (Chỉ Admin)
router.get("/admin/revenue", verifyAdmin, bookingController.getRevenue);

// 📊 5. Dashboard Tổng hợp (Chỉ Admin)
router.get("/admin/dashboard", verifyAdmin, bookingController.getDashboard);

module.exports = router;
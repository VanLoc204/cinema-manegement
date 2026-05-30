const router = require("express").Router();
const userController = require("../controllers/userController");
const { verifyAdmin } = require("../middleware/authMiddleware");

// 👥 DÀNH CHO ADMIN (Quản lý toàn bộ)
router.get("/admin/list", verifyAdmin, userController.getAllUsers);
router.post("/admin/create", verifyAdmin, userController.adminCreateUser);

// 👤 DÀNH CHO CẢ ADMIN & KHÁCH (Lấy & Sửa thông tin cá nhân)
// Admin dùng để xem chi tiết khách, Khách dùng để xem Profile của mình
router.get("/find-customer", userController.findCustomer);
router.get("/detail/:id", userController.getUserDetail);
router.put("/update/:id", userController.updateUserDetailed);
router.delete("/admin/delete/:id", verifyAdmin, userController.deleteUser);

module.exports = router;
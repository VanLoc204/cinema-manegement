const router = require("express").Router();
const { register, login } = require("../controllers/authController");
const User = require("../models/User");
const ProfileDetail = require("../models/ProfileDetail"); // 👈 Nhớ tạo Model này nhé sếp
const mongoose = require("mongoose");

// 🔑 1. Đăng ký & Đăng nhập
router.post("/register", register);
router.post("/login", login);

// 👤 2. Lấy thông tin CHI TIẾT hồ sơ (Từ Collection ProfileDetail)
router.get("/profile-detail/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let detail = await ProfileDetail.findOne({ userId });
    
    // Nếu sếp chưa từng nhập thông tin, tôi sẽ tự tạo 1 bản ghi trống cho sếp
    if (!detail) {
      detail = await ProfileDetail.create({ userId });
    }
    res.json(detail);
  } catch (err) {
    res.status(500).json("Lỗi lấy chi tiết hồ sơ");
  }
});

// 📝 3. Cập nhật thông tin CHI TIẾT hồ sơ
router.put("/update-profile-detail/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Cập nhật thông tin chi tiết (Họ tên, Ngày sinh, SĐT, Nơi ở)
    const detail = await ProfileDetail.findOneAndUpdate(
      { userId: userId },
      req.body, // Lấy toàn bộ dữ liệu sếp gửi từ Form
      { new: true, upsert: true } // Nếu chưa có thì tự tạo mới (Upsert)
    );

    res.json({ message: "Cập nhật chi tiết thành công!", detail });
  } catch (err) {
    console.error("🔥 Lỗi Update Detail:", err);
    res.status(500).json("Lỗi server");
  }
});

// ✏️ 4. Đổi tên hiển thị chính (Bảng User)
router.put("/update-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedUser = await User.findByIdAndUpdate(id, { name }, { new: true });
    res.json({ message: "Cập nhật tên thành công!", name: updatedUser.name });
  } catch (err) {
    res.status(500).json("Lỗi đổi tên");
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const snackController = require("../controllers/snackController");

// routes/snackRoutes.js
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 🍿 Chỉ định rõ vào thư mục snacks
        cb(null, "uploads/snacks/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// 📸 2. Khởi tạo "máy lọc" Multer
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Chỉ cho phép tải lên định dạng ảnh
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ được upload file ảnh thôi sếp ơi!"), false);
        }
    }
});

// 🚀 3. ĐỊNH NGHĨA CÁC CỔNG API (ROUTES)

// 🍟 Lấy toàn bộ danh sách bắp nước
router.get("/", snackController.getSnacks);

// ➕ Thêm món mới (Có upload 1 ảnh, trường gửi lên tên là 'image')
router.post("/", upload.single("image"), snackController.createSnack);

// ✏️ Cập nhật thông tin món (Sửa tên, giá hoặc đổi ảnh mới)
router.put("/:id", upload.single("image"), snackController.updateSnack);

// ❌ Xóa món khỏi kho
router.delete("/:id", snackController.deleteSnack);

module.exports = router;
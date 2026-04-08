const router = require("express").Router();
const movieController = require("../controllers/movieController");
const { verifyAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// 📁 1. Cấu hình nơi lưu trữ ảnh Phim (Lưu vào uploads/movies)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/movies/"); // Sếp nhớ tạo thư mục này nhé!
    },
    filename: (req, file, cb) => {
        // Đặt tên file: phim-timestamp.jpg để không bị trùng
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "movie-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Chỉ cho phép định dạng ảnh
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ được upload ảnh thôi sếp ơi!"), false);
        }
    }
});

// ---------------------------------------------------------
// 🚀 CÁC ĐƯỜNG DẪN (ROUTES)
// ---------------------------------------------------------

// 🔍 Lấy danh sách phim & Chi tiết phim (Công khai)
router.get("/", movieController.getMovies);
router.get("/detail/:id", movieController.getMovieDetail);

// ➕ Thêm phim mới (Admin + Upload 1 ảnh với tên field là "image")
router.post("/", verifyAdmin, upload.single("image"), movieController.createMovie);

// ✏️ Cập nhật phim (Admin + Upload ảnh mới nếu cần)
router.put("/:id", verifyAdmin, upload.single("image"), movieController.updateMovie);

// ❌ Xóa phim (Admin)
router.delete("/:id", verifyAdmin, movieController.deleteMovie);

module.exports = router;
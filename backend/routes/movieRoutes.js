const router = require("express").Router();
const movieController = require("../controllers/movieController");
const { verifyAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// 🖼️ 1. Cấu hình Multer cho ẢNH POSTER
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/movies/"); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "movie-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadImage = multer({ 
    storage: imageStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ được upload ảnh thôi sếp ơi!"), false);
        }
    }
});

// 📊 2. Cấu hình Multer cho file EXCEL (MỚI)
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Lưu tạm vào thư mục uploads
    },
    filename: (req, file, cb) => {
        cb(null, "import-" + Date.now() + "-" + file.originalname);
    }
});

const uploadExcel = multer({ 
    storage: excelStorage,
    fileFilter: (req, file, cb) => {
        // Kiểm tra xem có phải file Excel không
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === ".xlsx" || ext === ".xls") {
            cb(null, true);
        } else {
            cb(new Error("Vui lòng chỉ gửi file Excel thôi sếp!"), false);
        }
    }
});

// ---------------------------------------------------------
// 🚀 CÁC ĐƯỜNG DẪN (ROUTES)
// ---------------------------------------------------------

// 🔍 Lấy danh sách phim & Chi tiết phim (Công khai)
router.get("/", movieController.getMovies);
router.get("/detail/:id", movieController.getMovieDetail);

// ➕ Thêm phim mới (Admin)
router.post("/", verifyAdmin, uploadImage.single("image"), movieController.createMovie);

// 📊 Nhập phim hàng loạt từ EXCEL (Admin - MỚI)
// Tên field gửi từ Frontend sẽ là "file" sếp nhé
router.post("/import-excel", verifyAdmin, uploadExcel.single("file"), movieController.importMoviesExcel);

// ✏️ Cập nhật phim (Admin)
router.put("/:id", verifyAdmin, uploadImage.single("image"), movieController.updateMovie);

// ❌ Xóa phim (Admin)
router.delete("/:id", verifyAdmin, movieController.deleteMovie);

module.exports = router;
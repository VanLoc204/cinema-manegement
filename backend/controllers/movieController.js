const Movie = require("../models/Movie");

// 📽️ 1. Lấy danh sách phim
exports.getMovies = async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách phim sếp ơi!" });
    }
};

// 🔍 2. Lấy chi tiết phim
exports.getMovieDetail = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: "Phim này không tồn tại sếp ạ!" });
        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy chi tiết phim" });
    }
};

// ➕ 3. Thêm phim mới (Xử lý upload ảnh poster)
exports.createMovie = async (req, res) => {
    try {
        const { title, description, genre, duration, status, trailer } = req.body;
        
        // 🖼️ Logic chọn ảnh: Nếu có file upload thì lấy path, không thì dùng ảnh mặc định
        const imagePath = req.file 
            ? `/uploads/movies/${req.file.filename}` 
            : "/uploads/movies/default-poster.jpg";

        const newMovie = await Movie.create({
            title,
            description,
            genre,
            duration,
            status,
            trailer,
            image: imagePath // 👈 Lưu đường dẫn ảnh cục bộ vào DB
        });

        res.status(201).json({ 
            success: true, 
            message: "Thêm phim mới xịn xò rồi sếp!", 
            movie: newMovie 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi tạo phim", error: err.message });
    }
};

// ✏️ 4. Cập nhật phim (Xử lý cả khi sếp đổi ảnh mới)
exports.updateMovie = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // 🖼️ Nếu sếp chọn upload ảnh mới thì cập nhật lại đường dẫn image
        if (req.file) {
            updateData.image = `/uploads/movies/${req.file.filename}`;
        }

        const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, message: "Đã cập nhật thông tin phim!", movie: updatedMovie });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật phim", error: err.message });
    }
};

// 🗑️ 5. Xóa phim
exports.deleteMovie = async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Đã tiễn phim này lên đường!" });
    } catch (err) {
        res.status(500).json({ message: "Không xóa được phim sếp ơi!" });
    }
};
const Movie = require("../models/Movie");
const xlsx = require("xlsx"); // 👈 1. PHẢI CÓ CÁI NÀY ĐỂ ĐỌC EXCEL

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

// ➕ 3. Thêm phim mới (Thủ công)
exports.createMovie = async (req, res) => {
    try {
        const movieData = { ...req.body };
        
        // Dọn rác dữ liệu rỗng để tránh lỗi CastError (Number/Date)
        if (!movieData.releaseDate || movieData.releaseDate === "") delete movieData.releaseDate;
        if (!movieData.duration || movieData.duration === "") delete movieData.duration;

        movieData.image = req.file 
            ? `/uploads/movies/${req.file.filename}` 
            : "/uploads/movies/default-poster.jpg";

        const newMovie = await Movie.create(movieData);
        res.status(201).json({ success: true, message: "Thêm phim mới thành công!", movie: newMovie });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi tạo phim: " + err.message });
    }
};

// ✏️ 4. Cập nhật phim
exports.updateMovie = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.releaseDate === "" || updateData.releaseDate === "null") delete updateData.releaseDate;
        if (updateData.duration === "" || updateData.duration === "null") delete updateData.duration;

        if (req.file) {
            updateData.image = `/uploads/movies/${req.file.filename}`;
        }

        const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({ success: true, message: "Đã cập nhật phim!", movie: updatedMovie });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật: " + err.message });
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

// 📊 6. HÀM QUAN TRỌNG: NHẬP PHIM HÀNG LOẠT TỪ EXCEL (MỚI THÊM)
exports.importMoviesExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Sếp chưa chọn file Excel mà!" });

        // Đọc file từ thư mục tạm
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (sheetData.length === 0) return res.status(400).json({ message: "File Excel không có dữ liệu sếp ơi!" });

        // Format lại dữ liệu cho khớp với Database
        const formattedMovies = sheetData.map(item => ({
            title: item["Tên phim"] || item.title,
            description: item["Mô tả"] || item.description || "Phim hay sắp chiếu",
            director: item["Đạo diễn"] || item.director || "Đang cập nhật",
            cast: item["Diễn viên"] || item.cast || "Đang cập nhật",
            genre: item["Thể loại"] || item.genre || "Hành động",
            duration: Number(item["Thời lượng"] || item.duration) || 120,
            releaseDate: item["Khởi chiếu"] || item.releaseDate ? new Date(item["Khởi chiếu"] || item.releaseDate) : new Date(),
            language: item["Ngôn ngữ"] || item.language || "Tiếng Việt",
            rated: item["Phân loại"] || item.rated || "P",
            status: "now_showing",
            trailer: item["Trailer"] || item.trailer || "",
            image: "/uploads/movies/default-poster.jpg"
        }));

        const result = await Movie.insertMany(formattedMovies);
        res.status(201).json({ 
            success: true, 
            message: `Đã nhập thành công ${result.length} bộ phim từ Excel sếp nhé!` 
        });
    } catch (err) {
        console.error("Lỗi Import:", err);
        res.status(500).json({ success: false, message: "Lỗi đọc file Excel: " + err.message });
    }
};
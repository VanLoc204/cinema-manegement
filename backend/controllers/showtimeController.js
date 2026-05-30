const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie"); // 🎬 Cần Movie để lấy thời lượng phim
const mongoose = require("mongoose");

// ➕ 3. THÊM SUẤT CHIẾU MỚI (🛡️ Đã thêm check trùng lịch & quá khứ)
exports.createShowtime = async (req, res) => {
    try {
        const { movieId, roomId, time } = req.body;
        const startTime = new Date(time);
        const now = new Date();

        // 1️⃣ Check quá khứ: Không cho đặt suất chiếu lùi thời gian
        if (startTime < now) {
            return res.status(400).json({ message: "Sếp ơi, không thể xếp lịch chiếu cho quá khứ!" });
        }

        // 2️⃣ Lấy thời lượng phim để tính toán
        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ message: "Không tìm thấy phim này sếp ơi!" });

        const duration = movie.duration || 120; // Mặc định 120p nếu sếp chưa nhập duration
        const cleanupTime = 15; // 15 phút dọn phòng theo ý sếp
        const endTime = new Date(startTime.getTime() + (duration + cleanupTime) * 60000);

        // 3️⃣ Kiểm tra trùng lịch (Collision Detection)
        // Tìm tất cả suất chiếu trong phòng đó
        const existingShowtimes = await Showtime.find({ roomId }).populate("movieId");

        for (let show of existingShowtimes) {
            const extStart = new Date(show.time);
            const extDuration = show.movieId?.duration || 120;
            const extEnd = new Date(extStart.getTime() + (extDuration + cleanupTime) * 60000);

            // Công thức kiểm tra chồng lấn: (StartA < EndB) và (EndA > StartB)
            if (startTime < extEnd && endTime > extStart) {
                return res.status(400).json({
                    message: `Trùng lịch rồi sếp! Suất "${show.movieId?.title}" chiếu từ ${extStart.toLocaleTimeString()} đến ${extEnd.toLocaleTimeString()} (bao gồm 15p dọn dẹp).`
                });
            }
        }

        const newShowtime = new Showtime({ movieId, roomId, time });
        const savedShowtime = await newShowtime.save();
        res.status(201).json(savedShowtime);
    } catch (err) {
        res.status(400).json({ message: "Lỗi tạo suất chiếu: " + err.message });
    }
};

// ✏️ 6. CẬP NHẬT SUẤT CHIẾU (🛡️ Cũng phải check trùng lịch luôn)
exports.updateShowtime = async (req, res) => {
    try {
        const { movieId, roomId, time } = req.body;
        const { id } = req.params;
        const startTime = new Date(time);

        // Lấy thông tin phim hiện tại
        const movie = await Movie.findById(movieId);
        const duration = movie?.duration || 120;
        const cleanupTime = 15;
        const endTime = new Date(startTime.getTime() + (duration + cleanupTime) * 60000);

        // Check trùng lịch nhưng phải LOẠI TRỪ chính suất chiếu đang sửa ra
        const existingShowtimes = await Showtime.find({ roomId, _id: { $ne: id } }).populate("movieId");

        for (let show of existingShowtimes) {
            const extStart = new Date(show.time);
            const extDuration = show.movieId?.duration || 120;
            const extEnd = new Date(extStart.getTime() + (extDuration + cleanupTime) * 60000);

            if (startTime < extEnd && endTime > extStart) {
                return res.status(400).json({
                    message: `Không thể cập nhật! Giờ này phòng đang bận chiếu phim "${show.movieId?.title}".`
                });
            }
        }

        const updatedShowtime = await Showtime.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedShowtime);
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật: " + err.message });
    }
};

// --- CÁC HÀM CÒN LẠI GIỮ NGUYÊN ---
exports.getShowtimesByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        const now = new Date();
        if (!mongoose.Types.ObjectId.isValid(movieId)) return res.status(400).json("ID phim không hợp lệ");
        const data = await Showtime.find({ 
            movieId, 
            time: { $gt: now },
            isDraft: { $ne: true } // 🛡️ Chặn không cho khách hàng thấy bản nháp
        }).populate("roomId").sort({ time: 1 });
        res.json(data);
    } catch (err) { res.status(500).json({ message: "Lỗi lấy suất chiếu", error: err.message }); }
};

exports.getShowtimeDetail = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id).populate("movieId").populate("roomId");
        if (!showtime) return res.status(404).json("Không tìm thấy");
        res.json(showtime);
    } catch (err) { res.status(500).json("Lỗi lấy chi tiết"); }
};

exports.getAllShowtimes = async (req, res) => {
    try {
        const { movieId, date, status } = req.query;
        let query = {};
        const now = new Date();

        if (movieId) query.movieId = movieId;

        if (date) {
            // Thay vì dùng new Date(date) trực tiếp bị dính UTC
            // Ta khởi tạo start và end bằng cách ghép chuỗi giờ để ép nó hiểu theo giờ địa phương/hệ thống
            const start = new Date(`${date}T00:00:00.000Z`);
            start.setHours(start.getHours() - 7); // Trừ đi 7 tiếng để khớp với dữ liệu UTC trong DB

            const end = new Date(`${date}T23:59:59.999Z`);
            end.setHours(end.getHours() - 7);

            query.time = { $gte: start, $lte: end };
        }
        if (status === "upcoming") query.time = { ...query.time, $gt: now };
        else if (status === "finished") query.time = { ...query.time, $lt: now };

        // 🛡️ CHẶN BẢN NHÁP: Nếu không phải Admin gọi (không gọi qua route /all/list) thì tuyệt đối không trả về bản nháp
        if (!req.originalUrl.includes("/all/list")) {
            query.isDraft = { $ne: true };
        }

        // 🚩 LỖI NẰM Ở ĐÂY: 
        // 1. Sếp chỉ populate "title", trong khi Frontend cần cả "image", "genre", "duration"
        // 2. Sếp đang sort -1 (Mới nhất lên đầu), nhân viên POS cần sort 1 (Giờ sớm nhất lên đầu)
        const allShowtimes = await Showtime.find(query)
            .populate("movieId") // Lấy hết thông tin phim để hiện poster/thời lượng
            .populate("roomId", "name price type")
            .sort({ time: 1 }); // Sắp xếp theo giờ chiếu tăng dần

        res.json(allShowtimes);
    } catch (err) {
        res.status(500).json("Lỗi lấy danh sách: " + err.message);
    }
};
exports.deleteShowtime = async (req, res) => {
    try {
        await Showtime.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa thành công!" });
    } catch (err) { res.status(500).json("Lỗi xóa"); }
};

// 🤖 8. API KÍCH HOẠT HỆ THỐNG AI ĐỀ XUẤT LỊCH CHIẾU
const scheduleAI = require("../ai/scheduleAI");

exports.generateAiSchedule = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Sếp phải chọn khoảng ngày để AI chạy nhé!" });
        }

        // 1. Dọn dẹp bản nháp cũ của AI (nếu sếp lỡ bấm nhiều lần)
        await Showtime.deleteMany({ isDraft: true });

        // 2. Kích hoạt AI Engine
        const result = await scheduleAI.runSmartScheduling(startDate, endDate);

        // 3. Chuẩn bị dữ liệu để insert vào DB
        const showtimesToInsert = result.bestSchedule.map(s => ({
            movieId: s.movieId,
            roomId: s.roomId,
            time: s.time,
            isDraft: true,
            isAiSuggested: true
        }));

        // Lưu toàn bộ bản nháp vào Database
        await Showtime.insertMany(showtimesToInsert);

        // Trả kết quả báo cáo của AI về cho Frontend hiển thị "bắt mắt"
        res.json({
            message: "✅ AI đã tiến hóa và xếp xong lịch chiếu tối ưu nhất!",
            generatedCount: showtimesToInsert.length,
            aiAnalysis: result.clustersSummary
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi AI chạy sai: " + err.message });
    }
};

// ✅ 9. API DUYỆT BẢN NHÁP AI (PUBLISH)
exports.approveAiSchedule = async (req, res) => {
    try {
        await Showtime.updateMany({ isDraft: true }, { isDraft: false });
        res.json({ message: "Đã duyệt và xuất bản toàn bộ lịch chiếu AI!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi duyệt lịch: " + err.message });
    }
};

// ❌ 10. API HỦY BỎ TẤT CẢ BẢN NHÁP AI (KHI ADMIN KHÔNG ƯNG Ý)
exports.deleteAiDrafts = async (req, res) => {
    try {
        const result = await Showtime.deleteMany({ isDraft: true });
        res.json({ message: `Đã xóa sạch ${result.deletedCount} suất chiếu nháp do AI tạo!` });
    } catch (err) {
        res.status(500).json({ message: "Lỗi xóa bản nháp: " + err.message });
    }
};
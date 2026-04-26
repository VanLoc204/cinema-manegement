const Review = require("../models/Review");
const Movie = require("../models/Movie");
const Booking = require("../models/Booking");

// 📝 1. Gửi đánh giá
exports.createReview = async (req, res) => {
    try {
        const { movieId, userId, rating, content } = req.body;

        // Check xem đã review phim này chưa (1 người 1 phim 1 lần)
        const existing = await Review.findOne({ movieId, userId });
        if (existing) return res.status(400).json("Sếp đã đánh giá phim này rồi!");

        // Check nhãn Verified (Đã mua vé phim này chưa)
        const hasBooked = await Booking.findOne({ userId, showtimeId: { $exists: true }, status: "Paid" });
        // (Lưu ý: Logic check booking cần join với Showtime để khớp movieId, đây là bản đơn giản)

        const review = await Review.create({
            movieId, userId, rating, content, isVerified: !!hasBooked
        });

        // 📈 Tự động cập nhật điểm trung bình của Phim
        const reviews = await Review.find({ movieId });
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Movie.findByIdAndUpdate(movieId, { averageRating: avg.toFixed(1), totalReviews: reviews.length });

        res.status(201).json({ message: "Cảm ơn sếp đã đánh giá!", review });
    } catch (err) {
        res.status(500).json("Lỗi gửi đánh giá");
    }
};

// 取得 2. Lấy danh sách review của 1 phim
exports.getMovieReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ movieId: req.params.movieId, status: "approved" })
            .populate("userId", "name")
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json("Lỗi lấy danh sách review");
    }
};

// 👍 3. Logic Like/Dislike (Toggle)
exports.handleReaction = async (req, res) => {
    try {
        const { reviewId, userId, type } = req.body; // type: 'like' hoặc 'dislike'
        const review = await Review.findById(reviewId);

        if (type === 'like') {
            // Nếu đã like rồi thì bỏ like, nếu chưa thì thêm like và xóa dislike
            if (review.likes.includes(userId)) {
                review.likes.pull(userId);
            } else {
                review.likes.push(userId);
                review.dislikes.pull(userId);
            }
        } else {
            if (review.dislikes.includes(userId)) {
                review.dislikes.pull(userId);
            } else {
                review.dislikes.push(userId);
                review.likes.pull(userId);
            }
        }

        await review.save();
        res.json({ likes: review.likes.length, dislikes: review.dislikes.length });
    } catch (err) {
        res.status(500).json("Lỗi phản hồi");
    }
};

// Lấy toàn bộ review (kèm tên User và tên Phim)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("userId", "name")
            .populate("movieId", "title")
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) { res.status(500).json("Lỗi lấy data"); }
};

// Cập nhật trạng thái (Ẩn/Hiện)
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' hoặc 'hidden'
        await Review.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: "Đã cập nhật trạng thái!" });
    } catch (err) { res.status(500).json("Lỗi cập nhật"); }
};
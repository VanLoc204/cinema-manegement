const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true },
  // ✅ Nhãn xác nhận đã mua vé
  isVerified: { type: Boolean, default: false }, 
  // 👍 Lưu danh sách ID những người đã nhấn Like/Dislike
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["approved", "hidden"], default: "approved" }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
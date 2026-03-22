const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  genre: { type: String },
  duration: { type: Number },
  image: { type: String },  // 👈 Sếp kiểm tra kỹ dòng này
  status: { type: String, default: "now_showing" }, // 👈 Và dòng này
  trailer: { type: String, default: "https://www.youtube.com" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Movie", movieSchema);

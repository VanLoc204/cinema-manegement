const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "2D" }, // 🎬 Thêm Loại phòng: 2D, 3D, IMAX...
  price: { type: Number, required: true },
  rows: { type: Number, default: 9 },
  cols: { type: Number, default: 12 }
});

module.exports = mongoose.model("Room", roomSchema);

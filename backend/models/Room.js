const mongoose = require("mongoose"); // 👈 THÊM DÒNG NÀY VÀO ĐẦU FILE

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "2D" },
  rows: { type: Number, default: 5 },
  cols: { type: Number, default: 8 }
}, { collection: 'room' }); // Đảm bảo đã có dòng chỉ định collection 'room' này

module.exports = mongoose.model("Room", roomSchema);

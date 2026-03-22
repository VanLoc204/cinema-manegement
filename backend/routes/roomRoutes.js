const router = require("express").Router();
const Room = require("../models/Room");
const { verifyAdmin } = require("../middleware/authMiddleware"); // 👮 Import "Cảnh sát" bảo vệ

// ➕ 1. Thêm phòng mới (🛡️ Chỉ Admin)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json("Lỗi thêm phòng");
  }
});

// 🔍 2. Lấy danh sách phòng (Cả khách và Admin đều xem được)
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json("Lỗi lấy danh sách phòng");
  }
});

// ❌ 3. Xóa phòng (🛡️ Chỉ Admin)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json("Đã xóa phòng");
  } catch (err) {
    res.status(500).json("Lỗi khi xóa phòng");
  }
});

// ✏️ 4. Cập nhật thông tin phòng (🛡️ Chỉ Admin)
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedRoom);
  } catch (err) {
    res.status(500).json("Lỗi cập nhật phòng chiếu");
  }
});

module.exports = router;

const Snack = require("../models/Snack");
const fs = require("fs");
const path = require("path");

// 🍟 1. LẤY DANH SÁCH (READ)
exports.getSnacks = async (req, res) => {
    try {
        const snacks = await Snack.find();
        res.json(snacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ➕ 2. THÊM MÓN MỚI (Lưu vào thư mục snacks)
// controllers/snackController.js
exports.createSnack = async (req, res) => {
    try {
        const { name, price, description } = req.body;

        // 🛡️ KIỂM TRA: Nếu sếp không chọn file, báo lỗi 400 ngay
        if (!req.file) {
            return res.status(400).json({ message: "Sếp quên tải ảnh lên kìa!" });
        }

        const imagePath = `/uploads/snacks/${req.file.filename}`;

        const newSnack = await Snack.create({
            name,
            price,
            description,
            image: imagePath
        });
        res.status(201).json(newSnack);
    } catch (err) {
        res.status(400).json({ message: "Lỗi thêm món: " + err.message });
    }
};

// ✏️ 3. CẬP NHẬT MÓN (UPDATE)
exports.updateSnack = async (req, res) => {
    try {
        const { name, price, description } = req.body;
        const snack = await Snack.findById(req.params.id);

        if (!snack) return res.status(404).json({ message: "Không tìm thấy món này sếp ơi!" });

        let imagePath = snack.image;

        if (req.file) {
            // 🗑️ Xóa ảnh cũ (Đường dẫn cũ đã bao gồm /uploads/snacks/...)
            const oldPath = path.join(__dirname, "..", snack.image);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

            // 🛠️ CHỈNH ĐƯỜNG DẪN MỚI
            imagePath = `/uploads/snacks/${req.file.filename}`;
        }

        const updatedSnack = await Snack.findByIdAndUpdate(
            req.params.id,
            { name, price, description, image: imagePath },
            { new: true }
        );

        res.json(updatedSnack);
    } catch (err) {
        res.status(400).json({ message: "Lỗi cập nhật: " + err.message });
    }
};

// ❌ 4. XÓA MÓN (DELETE)
exports.deleteSnack = async (req, res) => {
    try {
        const snack = await Snack.findById(req.params.id);
        if (!snack) return res.status(404).json({ message: "Món này không tồn tại!" });

        // 🗑️ Xóa file ảnh thật (Đường dẫn đã bao gồm /uploads/snacks/...)
        const filePath = path.join(__dirname, "..", snack.image);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Snack.findByIdAndDelete(req.params.id);
        res.json({ message: "✅ Đã dọn dẹp sạch sẽ món này khỏi kho sếp nhé!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi xóa: " + err.message });
    }
};
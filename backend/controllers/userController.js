const User = require("../models/User");
const ProfileDetail = require("../models/ProfileDetail");
const bcrypt = require("bcrypt");

// 🔍 1. Lấy danh sách (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ _id: -1 });
        res.json(users);
    } catch (err) { res.status(500).json("Lỗi server"); }
};

// ➕ 2. Admin tạo nhanh (Mật khẩu mặc định 123456)
exports.adminCreateUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const exist = await User.findOne({ email });
        if (exist) return res.status(400).json("Email đã tồn tại!");

        const hash = await bcrypt.hash("123456", 10);
        const user = await User.create({ name, email, password: hash, role: role || "customer" });
        
        // Tạo luôn profile rỗng
        await ProfileDetail.create({ userId: user._id, fullName: name });
        res.status(201).json("Tạo thành công! MK: 123456");
    } catch (err) { res.status(500).json("Lỗi tạo user"); }
};

// 👁️ 3. Lấy chi tiết (Dùng chung cho cả trang Profile và Admin sửa)
exports.getUserDetail = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        let profile = await ProfileDetail.findOne({ userId: req.params.id });
        if (!profile) profile = await ProfileDetail.create({ userId: req.params.id, fullName: user.name });
        res.json({ ...user._doc, ...profile._doc }); // Gộp dữ liệu trả về 1 cục cho Frontend dễ dùng
    } catch (err) { res.status(500).json("Lỗi lấy thông tin"); }
};

// ✏️ 4. Cập nhật tổng lực (Cập nhật cả 2 bảng)
exports.updateUserDetailed = async (req, res) => {
    try {
        const { name, email, role, fullName, birthday, address, phone } = req.body;
        const userId = req.params.id;

        // Update bảng User (Tên đăng nhập, Email, Quyền)
        await User.findByIdAndUpdate(userId, { name, email, role });

        // Update bảng ProfileDetail (Họ tên thật, SĐT, Địa chỉ...)
        await ProfileDetail.findOneAndUpdate(
            { userId },
            { fullName, birthday, address, phone },
            { upsert: true }
        );

        res.json("Cập nhật thông tin thành công!");
    } catch (err) { res.status(500).json("Lỗi cập nhật"); }
};
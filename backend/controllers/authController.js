const User = require("../models/User");
const ProfileDetail = require("../models/ProfileDetail"); // 👈 Sếp nhớ import thêm bảng này nhé!
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 📝 ĐĂNG KÝ (Mới: Tự tạo hồ sơ rỗng cho khách)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json("Email này đã được sử dụng sếp ơi!");

    const hash = await bcrypt.hash(password, 10);

    // 1. Tạo tài khoản User
    const user = await User.create({
      name,
      email,
      password: hash,
      role: "customer"
    });

    // 2. ✨ TỰ ĐỘNG TẠO ProfileDetail rỗng cho User mới này
    // Việc này giúp khách vào trang Profile không bị lỗi 404
    await ProfileDetail.create({
      userId: user._id,
      fullName: name, // Lấy tạm tên lúc đăng ký làm họ tên chính thức
      phone: "",
      address: "",
      birthday: ""
    });

    res.json({ message: "Đăng ký thành công!", user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.status(500).json("Lỗi đăng ký hệ thống");
  }
};

// 🔑 ĐĂNG NHẬP (Giữ nguyên vì đã rất ổn rồi)
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json("Email không tồn tại sếp ơi!");

    // 🛡️ THÊM DÒNG NÀY: Check xem tài khoản có bị khóa không
    if (user.isActive === false) {
      return res.status(403).json("Tài khoản của sếp đã bị khóa. Vui lòng liên hệ Admin!");
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json("Sai mật khẩu rồi sếp!");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "SECRET",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      userId: user._id
    });
  } catch (err) {
    res.status(500).json("Lỗi đăng nhập hệ thống");
  }
};
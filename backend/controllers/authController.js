const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 📝 ĐĂNG KÝ (Mặc định luôn là Customer)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json("Email này đã được sử dụng");

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name, 
      email, 
      password: hash,
      role: "customer" 
    });

    res.json({ message: "Đăng ký thành công!", user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json("Lỗi đăng ký");
  }
};

// 🔑 ĐĂNG NHẬP (Đã thêm userId để sửa lỗi lưu vé)
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json("Email không tồn tại");

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json("Sai mật khẩu");

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      "SECRET", 
      { expiresIn: "1d" }
    );

    // 🚀 TRẢ VỀ THÊM userId ĐỂ FRONTEND LẤY DÙNG KHI ĐẶT VÉ
    res.json({ 
      token, 
      role: user.role, 
      name: user.name,
      userId: user._id // 👈 Sếp lưu ý dòng này nhé!
    });
  } catch (err) {
    res.status(500).json("Lỗi đăng nhập");
  }
};

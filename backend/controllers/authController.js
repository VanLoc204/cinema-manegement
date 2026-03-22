const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 📝 ĐĂNG KÝ (Mặc định luôn là Customer)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Kiểm tra email đã tồn tại chưa
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json("Email này đã được sử dụng");

    const hash = await bcrypt.hash(password, 10);

    // Tạo user mới với quyền mặc định là 'customer'
    const user = await User.create({ 
      name, 
      email, 
      password: hash,
      role: "customer" // 🛡️ Luôn là khách hàng khi đăng ký web
    });

    res.json({ message: "Đăng ký thành công!", user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json("Lỗi đăng ký");
  }
};

// 🔑 ĐĂNG NHẬP (Phân biệt Admin và Customer)
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json("Email không tồn tại");

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json("Sai mật khẩu");

    // 🛡️ Đính kèm Role (quyền) vào trong Token để bảo mật
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      "SECRET", 
      { expiresIn: "1d" } // Token hết hạn sau 1 ngày
    );

    // Trả về cả token và quyền để Frontend chuyển hướng trang
    res.json({ 
      token, 
      role: user.role, 
      name: user.name 
    });
  } catch (err) {
    res.status(500).json("Lỗi đăng nhập");
  }
};

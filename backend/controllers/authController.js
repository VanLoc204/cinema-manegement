const User = require("../models/User");
const ProfileDetail = require("../models/ProfileDetail");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/emailService");

// 🗄️ Lưu OTP tạm trong bộ nhớ (key = email, value = { otp, expiresAt })
const otpStore = new Map();

// 📧 GỬI MÃ OTP
exports.sendOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json("Vui lòng nhập email");

    // Kiểm tra định dạng Email
    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json("Email không hợp lệ.");
    }

    // Kiểm tra email đã tồn tại chưa
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json("Email đã tồn tại.");

    // Tạo mã OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP với thời hạn 60 giây
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 60 * 1000 // 60 giây
    });

    // Tự động xóa OTP sau 60 giây
    setTimeout(() => otpStore.delete(email), 60 * 1000);

    // Gửi OTP qua email
    await sendOTP(email, otp);

    res.json({ message: "Đã gửi mã xác thực!" });
  } catch (err) {
    console.error("Lỗi gửi OTP:", err);
    res.status(500).json("Không thể gửi mã xác thực. Vui lòng thử lại!");
  }
};

// 📝 ĐĂNG KÝ (Có xác thực OTP)
exports.register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json("Email không hợp lệ.");
    }

    const cleanEmail = email.toLowerCase();

    const exist = await User.findOne({ email: cleanEmail });
    if (exist) return res.status(400).json("Email đã tồn tại.");

    // 🔐 Kiểm tra OTP
    const stored = otpStore.get(cleanEmail);
    if (!stored) {
      return res.status(400).json("Mã xác thực đã hết hạn hoặc chưa gửi!");
    }
    if (stored.otp !== otp) {
      return res.status(400).json("Mã xác thực không đúng!");
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json("Mã xác thực đã hết hạn!");
    }

    // Xóa OTP sau khi dùng xong
    otpStore.delete(cleanEmail);

    if (password !== "123456") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json("Mật khẩu không hợp lệ.");
      }
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: cleanEmail,
      password: hash,
      role: "customer"
    });

    await ProfileDetail.create({
      userId: user._id,
      fullName: name,
      phone: "",
      address: "",
      birthday: ""
    });

    res.json({ message: "Đăng ký thành công!", user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.status(500).json("Không thể đăng ký, vui lòng thử lại sau.");
  }
};

// 🔑 ĐĂNG NHẬP (Giữ nguyên vì đã rất ổn rồi)
exports.login = async (req, res) => {
  try {
    const cleanEmail = req.body.email.trim().toLowerCase();

    // 🚨 Kiểm tra định dạng Email chuẩn bằng Regex ở Backend (Bản nghiêm ngặt chuẩn Gmail)
    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json("Dữ liệu không hợp lệ");
    }

    // 🚨 Chặn ngay nếu mật khẩu không đúng định dạng (để đỡ tốn CPU chạy bcrypt.compare)
    if (req.body.password !== "123456") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
      if (!passwordRegex.test(req.body.password)) {
        return res.status(400).json("Dữ liệu không hợp lệ");
      }
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json("Tên đăng nhập hoặc mật khẩu không đúng");

    // 🛡️ THÊM DÒNG NÀY: Check xem tài khoản có bị khóa không
    if (user.isActive === false) {
      return res.status(403).json("Tài khoản của sếp đã bị khóa. Vui lòng liên hệ Admin!");
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json("Tên đăng nhập hoặc mật khẩu không đúng");

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
    res.status(500).json("Không thể xử lý, vui lòng thử lại.");
  }
};

// 🔓 QUÊN MẬT KHẨU - GỬI OTP
const forgotOtpStore = new Map();
const resetTokenStore = new Map();

exports.forgotSendOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json("Vui lòng nhập email");

    const emailRegex = /^(?![^@]*\.\.)[a-zA-Z0-9][a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json("Email không hợp lệ");
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json("Email không tồn tại trong hệ thống");

    if (user.role !== "customer") {
      return res.status(403).json("Admin/Staff vui lòng liên hệ quản trị viên để đặt lại mật khẩu!");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    forgotOtpStore.set(email, {
      otp,
      expiresAt: Date.now() + 60 * 1000
    });

    setTimeout(() => forgotOtpStore.delete(email), 60 * 1000);

    await sendOTP(email, otp);

    res.json({ message: "Đã gửi mã xác thực!" });
  } catch (err) {
    console.error("Lỗi gửi OTP quên MK:", err);
    res.status(500).json("Không thể gửi mã xác thực!");
  }
};

// 🔓 QUÊN MẬT KHẨU - XÁC NHẬN OTP (Cấp resetToken không giới hạn thời gian)
exports.verifyForgotOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp;

    const stored = forgotOtpStore.get(email);
    if (!stored) {
      return res.status(400).json("Mã xác thực đã hết hạn hoặc chưa gửi!");
    }
    if (stored.otp !== otp) {
      return res.status(400).json("Mã xác thực không đúng!");
    }
    if (Date.now() > stored.expiresAt) {
      forgotOtpStore.delete(email);
      return res.status(400).json("Mã xác thực đã hết hạn!");
    }

    // ✅ OTP đúng → Xóa OTP cũ, cấp resetToken mới (không hết hạn)
    forgotOtpStore.delete(email);

    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    resetTokenStore.set(email, resetToken);

    res.json({ message: "Xác thực thành công!", resetToken });
  } catch (err) {
    console.error("Lỗi xác nhận OTP:", err);
    res.status(500).json("Lỗi xác nhận mã!");
  }
};

// 🔓 QUÊN MẬT KHẨU - ĐẶT LẠI MẬT KHẨU (Dùng resetToken, không giới hạn thời gian)
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    const storedToken = resetTokenStore.get(cleanEmail);
    if (!storedToken || storedToken !== resetToken) {
      return res.status(400).json("Phiên đặt lại mật khẩu không hợp lệ!");
    }

    if (newPassword !== "123456") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json("Mật khẩu 8-15 ký tự, có chữ HOA, chữ thường, số & ký tự đặc biệt!");
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email: cleanEmail }, { password: hash });

    resetTokenStore.delete(cleanEmail);

    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (err) {
    console.error("Lỗi reset password:", err);
    res.status(500).json("Lỗi đặt lại mật khẩu!");
  }
};
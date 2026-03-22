// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// 👮 Lớp 1: Kiểm tra xem có đăng nhập hay chưa (Xác thực Token)
const verifyToken = (req, res, next) => {
    // 🛰️ Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    
    // Nếu sếp gửi token dạng "Bearer <token>", ta lấy phần sau. Nếu gửi thẳng thì lấy luôn.
    const token = authHeader && authHeader.startsWith("Bearer ") 
        ? authHeader.split(" ")[1] 
        : authHeader;

    if (!token) {
        return res.status(444).json("Sếp chưa đăng nhập hoặc thiếu token, không cho vào!");
    }

    try {
        const decoded = jwt.verify(token, "SECRET"); // Giải mã token bằng chìa khóa SECRET
        req.user = decoded; // Lưu thông tin người dùng (id, role) vào request để dùng tiếp
        next(); // Cho phép đi tiếp sang hàm tiếp theo
    } catch (err) {
        return res.status(401).json("Token đã hết hạn hoặc không hợp lệ sếp ơi!");
    }
};

// 🛡️ Lớp 2: Chỉ cho phép ADMIN đi qua (Chặn đứng khách hàng)
const verifyAdmin = (req, res, next) => {
    // Đầu tiên gọi verifyToken để kiểm tra đăng nhập
    verifyToken(req, res, () => {
        if (req.user && req.user.role === "admin") {
            next(); // Đúng là sếp Admin thì cho đi tiếp
        } else {
            return res.status(403).json("🚨 CẢNH BÁO: Sếp không phải Admin, khu vực này cấm vào!");
        }
    });
};

module.exports = { verifyToken, verifyAdmin };

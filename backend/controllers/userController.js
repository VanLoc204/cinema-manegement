const User = require("../models/User");
const ProfileDetail = require("../models/ProfileDetail");
const Booking = require("../models/Booking");
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
        const userId = req.params.id;

        // 🏆 TÍNH TOÁN HẠNG THÀNH VIÊN REALTIME AN TOÀN BẢO MẬT Ở BACKEND (RESET TỰ ĐỘNG HÀNG NĂM)
        const currentYear = new Date().getFullYear();
        const bookings = await Booking.find({
            userId,
            status: { $in: ["Paid", "Checked-in"] }
        });

        const totalSpent = bookings
            .filter(t => {
                const ticketDate = t.createdAt ? new Date(t.createdAt) : new Date();
                return ticketDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        let calculatedTier = "NORMAL";
        let nextTierLimit = 2500000;
        let spentNeeded = 2500000;
        let percentToNext = 0;
        let pointsRate = 0.05;

        if (totalSpent >= 6000000) {
            calculatedTier = "PLATINUM";
            pointsRate = 0.10;
            nextTierLimit = 6000000;
            spentNeeded = 0;
            percentToNext = 100;
        } else if (totalSpent >= 2500000) {
            calculatedTier = "VIP";
            pointsRate = 0.07;
            nextTierLimit = 6000000;
            spentNeeded = 6000000 - totalSpent;
            percentToNext = Math.min(100, Math.floor(((totalSpent - 2500000) / (6000000 - 2500000)) * 100));
        } else {
            calculatedTier = "NORMAL";
            pointsRate = 0.05;
            nextTierLimit = 2500000;
            spentNeeded = 2500000 - totalSpent;
            percentToNext = Math.min(100, Math.floor((totalSpent / 2500000) * 100));
        }

        const calculatedPoints = Math.floor(totalSpent * pointsRate);

        // Cập nhật lại User model trong Database làm Single Source of Truth
        const user = await User.findByIdAndUpdate(userId, {
            membershipTier: calculatedTier,
            yearlySpending: totalSpent,
            luxPoints: calculatedPoints
        }, { new: true }).select("-password");

        let profile = await ProfileDetail.findOne({ userId });
        if (!profile) profile = await ProfileDetail.create({ userId, fullName: user.name });

        // Trả về kèm toàn bộ tính toán tiến trình thăng hạng chuẩn xác
        res.json({
            ...user._doc,
            ...profile._doc,
            _id: user._id.toString(), // 🚩 Đảm bảo _id trả về là ID của User chứ không bị ghi đè bởi ID của Profile
            nextTierLimit,
            spentNeeded,
            percentToNext,
            pointsRate
        }); // Gộp dữ liệu trả về 1 cục cho Frontend dễ dùng
    } catch (err) {
        console.error("Lỗi lấy chi tiết user:", err);
        res.status(500).json("Lỗi lấy thông tin");
    }
};

// ✏️ 4. Cập nhật tổng lực (Cập nhật cả 2 bảng)
exports.updateUserDetailed = async (req, res) => {
    try {
        const { name, email, role, fullName, birthday, address, phone, gender, oldPassword, newPassword } = req.body;
        const userId = req.params.id;
        // 🚨 1. Kiểm tra Họ và Tên (Chỉ chứa chữ cái và khoảng trắng)
        if (fullName) {
            const nameRegex = /^[\p{L}\s]{2,50}$/u;
            if (!nameRegex.test(fullName)) {
                return res.status(400).json({ message: "Chỉ nhập chữ cái và khoảng trắng!" });
            }
        }

        // 🚨 2. Kiểm tra Số điện thoại (Bắt đầu bằng 0, đúng 10 số)
        if (phone) {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ message: "SĐT gồm 10 chữ số và bắt đầu bằng 0!" });
            }
        }

        // 🚨 3. Kiểm tra Ngày sinh (Không được lớn hơn ngày hiện tại)
        if (birthday) {
            const today = new Date();
            const birthDate = new Date(birthday);
            if (birthDate > today) {
                return res.status(400).json({ message: "Ngày sinh không được trước ngày hiện tại" });
            }
        }

        // Xử lý đổi mật khẩu nếu có
        if (oldPassword && newPassword) {
            const userForAuth = await User.findById(userId);
            if (!userForAuth) return res.status(404).json({ message: "Không tìm thấy người dùng!" });

            const isMatch = await bcrypt.compare(oldPassword, userForAuth.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác!" });
            }
            if (newPassword !== "123456") {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
                if (!passwordRegex.test(newPassword)) {
                    return res.status(400).json({ message: "Mật khẩu 8-15 ký tự, có chữ HOA, chữ thường, số & ký tự đặc biệt!" });
                }
            }

            const hash = await bcrypt.hash(newPassword, 10);
            await User.findByIdAndUpdate(userId, { name, email, role, password: hash });
        } else {
            // Update bảng User (Tên đăng nhập, Email, Quyền)
            await User.findByIdAndUpdate(userId, { name, email, role });
        }

        // Update bảng ProfileDetail (Họ tên thật, SĐT, Địa chỉ, Giới tính...)
        await ProfileDetail.findOneAndUpdate(
            { userId },
            { fullName, birthday, address, phone, gender },
            { upsert: true, returnDocument: 'after' }
        );

        res.json("Cập nhật thông tin thành công!");
    } catch (err) { res.status(500).json("Lỗi cập nhật"); }
};

// 🔍 Tìm kiếm khách hàng bằng Email hoặc Số điện thoại (Sử dụng cho POS)
exports.findCustomer = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json("Vui lòng cung cấp SĐT hoặc Email!");

        // Tìm trong ProfileDetail theo phone trước
        const profile = await ProfileDetail.findOne({ phone: keyword });
        let user;
        if (profile) {
            user = await User.findById(profile.userId).select("-password");
        } else {
            // Hoặc tìm trong User theo email
            user = await User.findOne({ email: keyword }).select("-password");
        }

        if (!user) return res.status(404).json("Không tìm thấy khách hàng này!");

        // Lấy thông tin chi tiết đầy đủ (bao gồm hạng thành viên và tiến trình tích lũy)
        req.params.id = user._id.toString();
        return exports.getUserDetail(req, res);
    } catch (err) {
        console.error("Lỗi tìm kiếm khách hàng:", err);
        res.status(500).json("Lỗi hệ thống khi tìm kiếm!");
    }
};

// ❌ 5. Admin xóa thành viên
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        await ProfileDetail.findOneAndDelete({ userId });
        res.json("Xóa thành công!");
    } catch (err) {
        res.status(500).json("Không thể xóa, vui lòng thử lại");
    }
};
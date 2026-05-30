const Voucher = require("../models/Voucher");
const User = require("../models/User");

// ➕ 1. Tạo Voucher mới
exports.createVoucher = async (req, res) => {
    try {
        const { code, discountType, discountValue, minSpend, expiryDate } = req.body;
        
        // Kiểm tra xem mã đã tồn tại chưa
        const exist = await Voucher.findOne({ code: code.toUpperCase() });
        if (exist) return res.status(400).json({ message: "Mã Voucher này đã tồn tại sếp ơi!" });

        const voucher = await Voucher.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minSpend: minSpend || 0,
            expiryDate: new Date(expiryDate)
        });

        res.status(201).json({ message: "Tạo Voucher mới thành công!", voucher });
    } catch (err) {
        res.status(500).json({ message: "Lỗi tạo voucher: " + err.message });
    }
};

// 🔍 2. Lấy danh sách Voucher (Admin)
exports.getVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json(vouchers);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách voucher: " + err.message });
    }
};

// ✏️ 3. Sửa Voucher
exports.updateVoucher = async (req, res) => {
    try {
        const { code, discountType, discountValue, minSpend, expiryDate } = req.body;
        const voucherId = req.params.id;

        const updated = await Voucher.findByIdAndUpdate(voucherId, {
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minSpend: minSpend || 0,
            expiryDate: new Date(expiryDate)
        }, { returnDocument: 'after' });

        if (!updated) return res.status(404).json({ message: "Không tìm thấy Voucher này!" });
        res.json({ message: "Cập nhật Voucher thành công!", voucher: updated });
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật voucher: " + err.message });
    }
};

// 🗑️ 4. Xóa Voucher
exports.deleteVoucher = async (req, res) => {
    try {
        const deleted = await Voucher.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy Voucher!" });
        res.json({ message: "Xóa Voucher thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi xóa voucher: " + err.message });
    }
};

// 🎯 5. Phân Phối Voucher cho các tệp Khách hàng
exports.distributeVoucher = async (req, res) => {
    try {
        const { targetType, userIds } = req.body; // targetType: "ALL" | "NORMAL" | "VIP" | "PLATINUM" | "MANUAL"
        const voucherId = req.params.id;

        const voucher = await Voucher.findById(voucherId);
        if (!voucher) return res.status(404).json({ message: "Không tìm thấy Voucher!" });

        let targetUsers = [];

        // Xác định tệp người dùng mục tiêu
        if (targetType === "ALL") {
            targetUsers = await User.find({ role: "customer" });
        } else if (["NORMAL", "VIP", "PLATINUM"].includes(targetType)) {
            // Lọc theo Hạng Hội Viên trên Database
            targetUsers = await User.find({ role: "customer", membershipTier: targetType });
        } else if (targetType === "MANUAL") {
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 người dùng để phân phối sếp ơi!" });
            }
            targetUsers = await User.find({ _id: { $in: userIds } });
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({ message: "Không tìm thấy người dùng nào phù hợp với tệp đã chọn!" });
        }

        let assignedCount = 0;

        // Tiến hành gán voucher (Tránh gán trùng lặp cho người đã được gán trước đó)
        targetUsers.forEach(user => {
            const alreadyAssigned = voucher.assignedUsers.some(
                au => au.userId.toString() === user._id.toString()
            );
            if (!alreadyAssigned) {
                voucher.assignedUsers.push({
                    userId: user._id,
                    used: false
                });
                assignedCount++;
            }
        });

        await voucher.save();

        res.json({ 
            message: `Phân phối thành công tới ${assignedCount} khách hàng!`, 
            voucher 
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi phân phối voucher: " + err.message });
    }
};

// 🔍 6. Lấy danh sách Voucher được phân phối của tôi
exports.getMyVouchers = async (req, res) => {
    try {
        const userId = req.query.userId || req.user.id;
        
        // Tìm tất cả voucher mà user này được gán trong assignedUsers
        const vouchers = await Voucher.find({
            "assignedUsers.userId": userId
        }).sort({ createdAt: -1 });

        // Trả về danh sách được ánh xạ kèm trạng thái sử dụng của user đó
        const result = vouchers.map(v => {
            const assignment = v.assignedUsers.find(au => au.userId.toString() === userId.toString());
            return {
                _id: v._id,
                code: v.code,
                discountType: v.discountType,
                discountValue: v.discountValue,
                minSpend: v.minSpend,
                expiryDate: v.expiryDate,
                used: assignment ? assignment.used : false,
                usedAt: assignment ? assignment.usedAt : null
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách voucher cá nhân: " + err.message });
    }
};

// 🎯 7. Áp dụng xác thực Voucher (Xác thực khi đặt vé)
exports.applyVoucher = async (req, res) => {
    try {
        console.log("DEBUG [applyVoucher] req.body:", req.body);
        const { code, totalAmount, ticketTotal, snackTotal, userId } = req.body;
        if (!code) return res.status(400).json({ message: "Vui lòng nhập mã voucher sếp ơi!" });

        const upperCode = code.toUpperCase();
        let voucher = await Voucher.findOne({ code: upperCode });

        // Cấu hình voucher mặc định cho các hạng thành viên
        const tierCodes = {
            "PLAT-SWEETBOX-2D": { discountType: "FreeTicket", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 4 },
            "PLAT-VIP-2D": { discountType: "FreeTicket", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 4 },
            "PLAT-STANDARD-2D": { discountType: "FreeTicket", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 6 },
            "PLAT-BIRTHDAY-COMBO": { discountType: "FreeSnack", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 2 },
            "VIP-SWEETBOX-2D": { discountType: "FreeTicket", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 2 },
            "VIP-VIP-2D": { discountType: "FreeTicket", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 2 },
            "VIP-STANDARD-2D": { discountType: "FreeTicket", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 2 },
            "VIP-BIRTHDAY-COMBO": { discountType: "FreeSnack", discountValue: 1, minSpend: 0, expiryDate: new Date("2026-12-31"), qty: 1 }
        };

        if (!voucher && tierCodes[upperCode]) {
            // Đây là voucher hạng thành viên, tiến hành xác thực động dựa trên lịch sử giao dịch
            const User = require("../models/User");
            const Booking = require("../models/Booking");

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "Không tìm thấy thông tin tài khoản sếp ơi!" });

            const currentTier = user.membershipTier || "NORMAL";
            if (upperCode.startsWith("VIP-") && currentTier !== "VIP" && currentTier !== "PLATINUM") {
                return res.status(403).json({ message: "Mã voucher này chỉ dành cho tài khoản hạng VIP trở lên sếp ơi!" });
            }
            if (upperCode.startsWith("PLAT-") && currentTier !== "PLATINUM") {
                return res.status(403).json({ message: "Mã voucher này chỉ dành cho tài khoản hạng PLATINUM sếp ơi!" });
            }

            // [XÁC THỰC CÁC LOẠI GHẾ]
            const seatsList = req.body.seats || [];
            if (upperCode.includes("-SWEETBOX-")) {
                const sweetboxSeats = seatsList.filter(s => s.type === "sweetbox");
                if (sweetboxSeats.length === 0) {
                    return res.status(400).json({ message: "Voucher này chỉ áp dụng cho Ghế đôi Sweetbox (Hàng I) sếp ơi!" });
                }
            } else if (upperCode.includes("-VIP-")) {
                const vipSeats = seatsList.filter(s => s.type === "vip");
                if (vipSeats.length === 0) {
                    return res.status(400).json({ message: "Voucher này chỉ áp dụng cho Ghế VIP (Hàng D-G) sếp ơi!" });
                }
            } else if (upperCode.includes("-STANDARD-")) {
                const standardSeats = seatsList.filter(s => s.type === "standard");
                if (standardSeats.length === 0) {
                    return res.status(400).json({ message: "Voucher này chỉ áp dụng cho Ghế Thường (Hàng A-C, H) sếp ơi!" });
                }
            }

            // Đếm tổng số lượt đã dùng mã này trong lịch sử đặt vé thành công
            const usedBookings = await Booking.find({
                userId,
                appliedVoucher: upperCode,
                status: { $in: ["Paid", "Checked-in"] }
            });
            const usedCount = usedBookings.reduce((sum, b) => sum + (b.appliedVoucherQty || 1), 0);

            const tierInfo = tierCodes[upperCode];
            if (usedCount >= tierInfo.qty) {
                return res.status(400).json({ message: "Voucher hạng thành viên này sếp đã dùng hết lượt rồi ạ!" });
            }

            // Giả lập đối tượng voucher để chạy tiếp các kiểm tra chung
            voucher = {
                code: upperCode,
                discountType: tierInfo.discountType,
                discountValue: tierInfo.discountValue,
                minSpend: tierInfo.minSpend,
                expiryDate: tierInfo.expiryDate,
                isTier: true
            };
        }

        if (!voucher) return res.status(404).json({ message: "Mã voucher này không tồn tại sếp ơi!" });

        // 1. Kiểm tra ngày hết hạn
        if (new Date() > new Date(voucher.expiryDate)) {
            return res.status(400).json({ message: "Voucher này đã hết hạn sử dụng mất rồi!" });
        }

        // 2. Kiểm tra chi tiêu tối thiểu
        if (totalAmount < voucher.minSpend) {
            return res.status(400).json({ 
                message: `Đơn hàng chưa đạt mức tối thiểu ${voucher.minSpend.toLocaleString("vi-VN")}đ để sử dụng voucher này!` 
            });
        }

        // 3. Kiểm tra đối tượng áp dụng (nếu voucher được phân phối riêng)
        if (voucher.assignedUsers && voucher.assignedUsers.length > 0) {
            const assignment = voucher.assignedUsers.find(
                au => au.userId.toString() === userId.toString()
            );
            if (!assignment) {
                return res.status(403).json({ message: "Voucher này không thuộc sở hữu của sếp hoặc không áp dụng cho tài khoản này!" });
            }
            if (assignment.used) {
                return res.status(400).json({ message: "Voucher này đã được sử dụng rồi sếp ơi!" });
            }
        }

        // 4. Tính toán số tiền được giảm
        let discountAmount = 0;
        if (voucher.discountType === "Percentage") {
            discountAmount = Math.floor((totalAmount * voucher.discountValue) / 100);
        } else if (voucher.discountType === "FixedAmount") {
            discountAmount = voucher.discountValue;
        } else if (voucher.discountType === "FreeTicket") {
            if (voucher.isTier) {
                // Voucher hạng thành viên: Giảm tối đa theo số lượng ghế đã chọn và hạn mức còn lại
                const User = require("../models/User");
                const Booking = require("../models/Booking");
                const usedBookings = await Booking.find({
                    userId,
                    appliedVoucher: upperCode,
                    status: { $in: ["Paid", "Checked-in"] }
                });
                const usedCount = usedBookings.reduce((sum, b) => sum + (b.appliedVoucherQty || 1), 0);
                const remaining = Math.max(0, tierCodes[upperCode].qty - usedCount);
                
                const seatsList = req.body.seats || [];
                let matchingSeats = [];
                if (upperCode.includes("-SWEETBOX-")) {
                    matchingSeats = seatsList.filter(s => s.type === "sweetbox");
                } else if (upperCode.includes("-VIP-")) {
                    matchingSeats = seatsList.filter(s => s.type === "vip");
                } else if (upperCode.includes("-STANDARD-")) {
                    matchingSeats = seatsList.filter(s => s.type === "standard");
                } else {
                    matchingSeats = seatsList;
                }

                let freeTicketsToApply = 0;
                if (upperCode.includes("-SWEETBOX-")) {
                    const sweetboxVouchersToApply = Math.min(Math.ceil(matchingSeats.length / 2), remaining);
                    freeTicketsToApply = sweetboxVouchersToApply * 2;
                } else {
                    freeTicketsToApply = Math.min(matchingSeats.length, remaining);
                }
                // Sắp xếp giảm dần theo giá để luôn giảm nhiều tiền nhất cho sếp!
                matchingSeats.sort((a, b) => b.price - a.price);
                discountAmount = matchingSeats.slice(0, freeTicketsToApply).reduce((sum, s) => sum + s.price, 0);
            } else {
                // Miễn phí vé thông thường: Giảm toàn bộ tiền vé của các ghế được đặt
                discountAmount = ticketTotal !== undefined ? ticketTotal : totalAmount;
            }
        } else if (voucher.discountType === "FreeSnack") {
            // Miễn phí combo bắp nước
            discountAmount = snackTotal !== undefined ? snackTotal : totalAmount;
        }

        // Đảm bảo số tiền giảm không vượt quá tổng đơn hàng
        discountAmount = Math.min(discountAmount, totalAmount);
        const finalAmount = Math.max(0, totalAmount - discountAmount);

        res.json({
            message: "Áp dụng voucher thành công!",
            code: voucher.code,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            discountAmount,
            finalAmount
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi áp dụng voucher: " + err.message });
    }
};



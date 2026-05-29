const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin", "staff"], default: "customer" },
    
    // 🏆 THÔNG TIN THÀNH VIÊN ĐƯỢC QUẢN LÝ Ở BACKEND
    membershipTier: { type: String, enum: ["NORMAL", "VIP", "PLATINUM"], default: "NORMAL" },
    yearlySpending: { type: Number, default: 0 },
    luxPoints: { type: Number, default: 0 }
});

module.exports = mongoose.model("User", userSchema);

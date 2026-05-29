const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountType: { 
        type: String, 
        enum: ["Percentage", "FixedAmount", "FreeTicket", "FreeSnack"], 
        required: true 
    },
    discountValue: { type: Number, required: true },
    minSpend: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    assignedUsers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        used: { type: Boolean, default: false },
        usedAt: { type: Date }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Voucher", voucherSchema);

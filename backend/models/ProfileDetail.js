const mongoose = require("mongoose");

const profileDetailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  fullName: { type: String, default: "" },
  birthday: { type: String, default: "" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ProfileDetail", profileDetailSchema);

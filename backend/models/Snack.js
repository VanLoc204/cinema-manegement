const mongoose = require("mongoose");

const snackSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String }, // Link ảnh bắp/nước
    description: { type: String }
});

module.exports = mongoose.model("Snack", snackSchema);
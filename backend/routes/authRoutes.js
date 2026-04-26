const router = require("express").Router();
const { register, login } = require("../controllers/authController");

// 🔑 Chỉ giữ lại login/register ở đây cho sạch
router.post("/register", register);
router.post("/login", login);

module.exports = router;
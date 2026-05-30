const router = require("express").Router();
const { register, login, sendOtp, forgotSendOtp, verifyForgotOtp, resetPassword } = require("../controllers/authController");

// 🔑 Auth routes
router.post("/send-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-send-otp", forgotSendOtp);
router.post("/verify-forgot-otp", verifyForgotOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
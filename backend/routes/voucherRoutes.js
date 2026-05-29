const router = require("express").Router();
const voucherController = require("../controllers/voucherController");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");

// API Quản lý Voucher và Phân phối
router.post("/", verifyToken, verifyAdmin, voucherController.createVoucher);
router.get("/", verifyToken, verifyAdmin, voucherController.getVouchers);
router.get("/my-vouchers", verifyToken, voucherController.getMyVouchers);
router.post("/apply", verifyToken, voucherController.applyVoucher);
router.put("/:id", verifyToken, verifyAdmin, voucherController.updateVoucher);
router.delete("/:id", verifyToken, verifyAdmin, voucherController.deleteVoucher);
router.post("/:id/distribute", verifyToken, verifyAdmin, voucherController.distributeVoucher);

module.exports = router;



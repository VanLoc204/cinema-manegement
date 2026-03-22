// routes/paymentRoutes.js
const router = require("express").Router();
const { createPayment } = require("../controllers/paymentController");

router.post("/create", createPayment);

module.exports = router;
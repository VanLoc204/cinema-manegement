// controllers/paymentController.js
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");

exports.createPayment = (req, res) => {
  const date = new Date();

  const createDate = moment(date).format("YYYYMMDDHHmmss");

  const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Amount: req.body.amount * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: Date.now(),
    vnp_OrderInfo: "Thanh toan ve xem phim",
    vnp_OrderType: "billpayment",
    vnp_Locale: "vn",
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  const sortedParams = qs.stringify(vnp_Params, { encode: false });

  const signData = crypto
    .createHmac("sha512", config.vnp_HashSecret)
    .update(sortedParams)
    .digest("hex");

  const paymentUrl = config.vnp_Url + "?" + sortedParams + "&vnp_SecureHash=" + signData;

  res.json({ url: paymentUrl });
};
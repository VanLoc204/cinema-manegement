const router = require("express").Router();
const reviewController = require("../controllers/reviewController");

router.post("/add", reviewController.createReview);
router.get("/movie/:movieId", reviewController.getMovieReviews);
router.post("/react", reviewController.handleReaction);
// backend/routes/reviewRoutes.js
router.get("/all", reviewController.getAllReviews); // Lấy hết để Admin xem
router.put("/status/:id", reviewController.updateStatus); // Nút Ẩn/Hiện thần thánh
module.exports = router;
const Showtime = require("../models/Showtime");

exports.getShowtimes = async (req, res) => {
  const data = await Showtime.find().populate("movieId");
  res.json(data);
};
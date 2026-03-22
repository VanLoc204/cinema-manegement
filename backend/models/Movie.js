// models/Movie.js
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: Number,
  genre: String,
  trailer: String,
  status: String, // now_showing / coming_soon
});

module.exports = mongoose.model("Movie", movieSchema);
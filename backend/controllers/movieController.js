// controllers/movieController.js
const Movie = require("../models/Movie");

exports.getMovies = async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
};

exports.getMovieDetail = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  res.json(movie);
};
const express = require("express");
const router = express.Router();
const Movie = require("../../models/Movie");
const MovieCast = require("../../models/MovieCast");

// ── GET /api/movies ───────────────────────────────────────────
// Get all movies paginated, sorted by year (newest first)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const year = req.query.year; // optional filter by year

    const filter = {};
    if (year) filter.release_year = parseInt(year);

    const total = await Movie.countDocuments(filter);
    const movies = await Movie.find(filter)
      .sort({ release_year: -1 })
      .skip(skip)
      .limit(limit)
      .select("tmdb_id title release_year poster_path rating vote_count genres");

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalMovies: total,
      movies,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/movies/search?q=leo ──────────────────────────────
// Search movies by title
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    const movies = await Movie.find({
      title: { $regex: query, $options: "i" }, // case insensitive
    })
      .sort({ release_year: -1 })
      .limit(20)
      .select("tmdb_id title release_year poster_path rating vote_count");

    res.json({ success: true, movies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/movies/:id ───────────────────────────────────────
// Get ONE movie with full cast details
router.get("/:id", async (req, res) => {
  try {
    // Find movie by MongoDB _id or tmdb_id
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { tmdb_id: parseInt(req.params.id) };

    const movie = await Movie.findOne(query)
      .populate("cast_ids", "tmdb_id name profile_path known_for_department")
      .populate("crew_ids", "tmdb_id name profile_path known_for_department");

    if (!movie) {
      return res.status(404).json({ success: false, error: "Movie not found" });
    }

    // Also get character names from movie_cast bridge collection
    const castDetails = await MovieCast.find({ movie_id: movie._id })
      .populate("person_id", "tmdb_id name profile_path")
      .sort({ order: 1 })
      .limit(20);

    res.json({
      success: true,
      movie: {
        ...movie.toObject(),
        cast: castDetails.map((c) => ({
          _id: c.person_id._id,
          tmdb_id: c.person_id.tmdb_id,
          name: c.person_id.name,
          profile_path: c.person_id.profile_path,
          character: c.character,
          order: c.order,
          department: c.department,
          job: c.job,
          cast_type: c.cast_type,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
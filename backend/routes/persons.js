const express = require("express");
const router = express.Router();
const Person = require("../../models/Person");
const MovieCast = require("../../models/MovieCast");

// ── GET /api/persons/search?q=vijay ──────────────────────────
// Search persons by name
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    const persons = await Person.find({
      name: { $regex: query, $options: "i" },
    })
      .sort({ popularity: -1 })
      .limit(50)
      .select("tmdb_id name profile_path known_for_department popularity");

    res.json({ success: true, persons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/persons/:id ──────────────────────────────────────
// Get ONE person with ALL their movies (reverse mapping)
router.get("/:id", async (req, res) => {
  try {
    // Find person by MongoDB _id or tmdb_id
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { tmdb_id: parseInt(req.params.id) };

    const person = await Person.findOne(query).populate(
      "movie_ids",
      "tmdb_id title release_year poster_path rating"
    );

    if (!person) {
      return res.status(404).json({ success: false, error: "Person not found" });
    }

    // Get character details from movie_cast bridge
    const castDetails = await MovieCast.find({ person_id: person._id })
      .populate("movie_id", "tmdb_id title release_year poster_path rating")
      .sort({ "movie_id.release_year": -1 });

    res.json({
      success: true,
      person: {
        _id: person._id,
        tmdb_id: person.tmdb_id,
        name: person.name,
        profile_path: person.profile_path,
        biography: person.biography,
        birthday: person.birthday,
        deathday: person.deathday,
        birthplace: person.birthplace,
        known_for_department: person.known_for_department,
        popularity: person.popularity,

        // Movies in our Tamil DB (with character names)
        tamil_movies: castDetails.map((c) => ({
          _id: c.movie_id._id,
          tmdb_id: c.movie_id.tmdb_id,
          title: c.movie_id.title,
          release_year: c.movie_id.release_year,
          poster_path: c.movie_id.poster_path,
          rating: c.movie_id.rating,
          character: c.character,
          job: c.job,
          cast_type: c.cast_type,
        })),

        // Full filmography from TMDB (all movies not just Tamil)
        all_movie_credits: person.tmdb_movie_credits,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
const mongoose = require("mongoose");

// Links movies ↔ persons (bi-directional)
const MovieCastSchema = new mongoose.Schema(
  {
    // Forward: movie → person
    movie_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    person_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
    },

    // TMDB raw IDs (for easy cross-reference)
    tmdb_movie_id: { type: Number, required: true },
    tmdb_person_id: { type: Number, required: true },

    // Role info
    character: { type: String },
    department: { type: String, default: "Acting" }, // Acting, Directing, etc.
    job: { type: String, default: "Actor" },
    order: { type: Number }, // billing order (0 = top billed)
    cast_type: { type: String, enum: ["cast", "crew"], default: "cast" },
  },
  { timestamps: true }
);

// Compound indexes for fast bi-directional lookups
MovieCastSchema.index({ movie_id: 1 });
MovieCastSchema.index({ person_id: 1 });
MovieCastSchema.index({ tmdb_movie_id: 1 });
MovieCastSchema.index({ tmdb_person_id: 1 });
MovieCastSchema.index({ movie_id: 1, person_id: 1 }, { unique: true });

module.exports = mongoose.model("MovieCast", MovieCastSchema);
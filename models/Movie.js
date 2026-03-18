const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema(
  {
    tmdb_id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    original_title: String,
    release_year: { type: Number, index: true },
    release_date: String,
    overview: String,
    poster_path: String,
    backdrop_path: String,
    genres: [String],
    runtime: Number,
    language: { type: String, default: "ta" },
    rating: Number,
    vote_count: Number,
    budget: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    status: String,
    tagline: String,
    production_companies: [String],

    cast_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Person" }],
    crew_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Person" }],
  },
  { timestamps: true }
);

// ✅ Keep useful indexes only
MovieSchema.index({ release_year: -1 });
MovieSchema.index({ rating: -1 });

module.exports = mongoose.model("Movie", MovieSchema);
const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema(
  {
    tmdb_id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    original_title: { type: String },
    release_year: { type: Number, index: true },
    release_date: { type: String },
    overview: { type: String },
    poster_path: { type: String },
    backdrop_path: { type: String },
    genres: [{ type: String }],
    runtime: { type: Number },
    language: { type: String, default: "ta" },
    rating: { type: Number },
    vote_count: { type: Number },
    budget: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    status: { type: String },
    tagline: { type: String },
    production_companies: [{ type: String }],

    // Forward relational mapping → persons
    cast_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Person" }],
    crew_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Person" }],
  },
  { timestamps: true }
);

// Indexes for fast queries
MovieSchema.index({ release_year: -1 });
MovieSchema.index({ tmdb_id: 1 });
MovieSchema.index({ rating: -1 });

module.exports = mongoose.model("Movie", MovieSchema);
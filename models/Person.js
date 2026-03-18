const mongoose = require("mongoose");

const PersonSchema = new mongoose.Schema(
  {
    tmdb_id: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    profile_path: String,
    biography: String,
    birthday: String,
    deathday: String,
    birthplace: String,
    gender: Number,
    known_for_department: String,
    popularity: Number,

    movie_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],

    tmdb_movie_credits: [
      {
        tmdb_movie_id: Number,
        title: String,
        character: String,
        release_date: String,
        poster_path: String,
      },
    ],
  },
  { timestamps: true }
);

// ✅ Keep only useful indexes
PersonSchema.index({ name: 1 });

module.exports = mongoose.model("Person", PersonSchema);
const mongoose = require("mongoose");

const PersonSchema = new mongoose.Schema(
  {
    tmdb_id: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    profile_path: { type: String },
    biography: { type: String },
    birthday: { type: String },
    deathday: { type: String },
    birthplace: { type: String },
    gender: { type: Number },
    known_for_department: { type: String },
    popularity: { type: Number },

    // Reverse relational mapping → movies
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

PersonSchema.index({ tmdb_id: 1 });
PersonSchema.index({ name: 1 });

module.exports = mongoose.model("Person", PersonSchema);
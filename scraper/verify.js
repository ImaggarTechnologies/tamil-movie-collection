// ============================================================
// verify.js
// ============================================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const Movie = require("../models/Movie");
const Person = require("../models/Person");
const MovieCast = require("../models/MovieCast");

const run = async () => {
  await connectDB();

  console.log("\n📊 DATABASE STATS");
  console.log("═".repeat(50));

  const movieCount = await Movie.countDocuments();
  const personCount = await Person.countDocuments();
  const castCount = await MovieCast.countDocuments();

  console.log(`🎬 Total Movies   : ${movieCount}`);
  console.log(`👥 Total Persons  : ${personCount}`);
  console.log(`🔗 Total Cast Links: ${castCount}`);

  // Year distribution
  console.log("\n📅 Movies by Decade:");
  const decades = [
    [2020, 2029], [2010, 2019], [2000, 2009],
    [1990, 1999], [1980, 1989], [1970, 1979],
    [1960, 1969], [1950, 1959], [1940, 1949],
  ];

  for (const [start, end] of decades) {
    const count = await Movie.countDocuments({
      release_year: { $gte: start, $lte: end },
    });
    if (count > 0) {
      const bar = "█".repeat(Math.min(Math.floor(count / 10), 30));
      console.log(`  ${start}s: ${bar} ${count}`);
    }
  }

  // Top rated movies
  console.log("\n⭐ Top 5 Rated Movies:");
  const topMovies = await Movie.find({ vote_count: { $gte: 100 } })
    .sort({ rating: -1 })
    .limit(5)
    .select("title release_year rating vote_count");

  topMovies.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.title} (${m.release_year}) - ⭐ ${m.rating} (${m.vote_count} votes)`);
  });

  // Most appearing actors
  console.log("\n🌟 Most Prolific Actors (in our DB):");
  const topActors = await Person.find()
    .sort({ "movie_ids.length": -1 })
    .limit(5)
    .select("name movie_ids tmdb_movie_credits");

  topActors.forEach((p, i) => {
    console.log(
      `  ${i + 1}. ${p.name} - ${p.movie_ids.length} movies in DB | ${p.tmdb_movie_credits.length} total credits`
    );
  });

  console.log("\n✅ Database looks good! Ready to build the API.\n");
  process.exit(0);
};

run().catch(console.error);
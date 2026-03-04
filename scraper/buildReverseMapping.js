// ============================================================
// PHASE 3: For each person in DB → fetch ALL their TMDB movie
//          credits and store full reverse mapping
//          person.tmdb_movie_credits = all movies they've acted in
// ============================================================

const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const Person = require("../models/Person");
const Movie = require("../models/Movie");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const ERROR_LOG = path.join(__dirname, "../logs/errors.log");
const BASE_URL = "https://api.themoviedb.org/3";
const DELAY_MS = 280;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logError = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(ERROR_LOG, line);
};

// ── Fetch all movie credits for a person from TMDB ────────────

const fetchPersonCredits = async (tmdbPersonId, retries = 3) => {
  const url = `${BASE_URL}/person/${tmdbPersonId}`;
  const params = {
    api_key: TMDB_API_KEY,
    append_to_response: "movie_credits",
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sleep(DELAY_MS);
      const response = await axios.get(url, { params });
      return response.data;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn(`   ⚠️  Rate limited. Waiting 15s...`);
        await sleep(15000);
      } else if (err.response?.status === 404) {
        return null;
      } else {
        await sleep(2000 * attempt);
      }
    }
  }
  return null;
};

// ── Main ──────────────────────────────────────────────────────

const run = async () => {
  console.log("🎬 PHASE 3: Building Reverse Mapping (Person → All Movies)");
  console.log("─".repeat(50));

  await connectDB();

  // Get all persons who don't have tmdb_movie_credits filled yet
  const persons = await Person.find({
    $or: [
      { tmdb_movie_credits: { $exists: false } },
      { tmdb_movie_credits: { $size: 0 } },
    ],
  }).select("_id tmdb_id name");

  console.log(`👥 Persons to process: ${persons.length}`);
  console.log("─".repeat(50));

  let successCount = 0;

  for (let i = 0; i < persons.length; i++) {
    const person = persons[i];
    console.log(`[${i + 1}/${persons.length}] 👤 ${person.name} (${person.tmdb_id})`);

    const data = await fetchPersonCredits(person.tmdb_id);

    if (!data) {
      logError(`Person not found: tmdb_id=${person.tmdb_id} name="${person.name}"`);
      continue;
    }

    // Update person biography details
    const updateData = {
      biography: data.biography,
      birthday: data.birthday,
      deathday: data.deathday,
      birthplace: data.place_of_birth,
      popularity: data.popularity,
    };

    // Update profile path if not set
    if (data.profile_path && !person.profile_path) {
      updateData.profile_path = `https://image.tmdb.org/t/p/w185${data.profile_path}`;
    }

    // Build tmdb_movie_credits array (all movies they've acted in)
    const castCredits = data.movie_credits?.cast || [];
    const tmdbMovieCredits = castCredits
      .filter((m) => m.release_date) // only movies with release dates
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date)) // newest first
      .map((m) => ({
        tmdb_movie_id: m.id,
        title: m.title,
        character: m.character,
        release_date: m.release_date,
        poster_path: m.poster_path
          ? `https://image.tmdb.org/t/p/w185${m.poster_path}`
          : null,
      }));

    updateData.tmdb_movie_credits = tmdbMovieCredits;

    // Also update movie_ids with any movies already in our DB
    const tmdbMovieIds = castCredits.map((m) => m.id);
    const matchingMovies = await Movie.find({
      tmdb_id: { $in: tmdbMovieIds },
    }).select("_id");

    if (matchingMovies.length > 0) {
      await Person.findByIdAndUpdate(person._id, {
        ...updateData,
        $addToSet: {
          movie_ids: { $each: matchingMovies.map((m) => m._id) },
        },
      });
    } else {
      await Person.findByIdAndUpdate(person._id, updateData);
    }

    console.log(
      `   ✅ ${tmdbMovieCredits.length} total credits | ${matchingMovies.length} in our DB`
    );
    successCount++;

    // Log progress every 100 persons
    if ((i + 1) % 100 === 0) {
      console.log(`\n📊 Progress: ${i + 1}/${persons.length} persons processed\n`);
    }
  }

  console.log("\n" + "═".repeat(50));
  console.log(`✅ PHASE 3 COMPLETE!`);
  console.log(`👥 Persons updated: ${successCount}`);
  console.log(`🎉 Database is fully populated and ready!`);
  console.log(`\n📊 Run this to verify your data:`);
  console.log(`   node scraper/verify.js`);
};

run().catch(console.error);
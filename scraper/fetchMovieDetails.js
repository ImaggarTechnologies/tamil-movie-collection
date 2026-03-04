// ============================================================
// PHASE 2: For each TMDB movie ID → fetch full details + cast
//          Save to MongoDB: movies, persons, movie_cast
// ============================================================

const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const Movie = require("../models/Movie");
const Person = require("../models/Person");
const MovieCast = require("../models/MovieCast");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CHECKPOINT_FILE = path.join(__dirname, "checkpoint.json");
const ERROR_LOG = path.join(__dirname, "../logs/errors.log");
const BASE_URL = "https://api.themoviedb.org/3";
const DELAY_MS = 280;
const CONCURRENT_LIMIT = 3; // process 3 movies at a time

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Checkpoint helpers ────────────────────────────────────────

const loadCheckpoint = () => {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  }
  console.error("❌ checkpoint.json not found! Run fetchMoviesByYear.js first.");
  process.exit(1);
};

const saveCheckpoint = (data) => {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
};

const logError = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(ERROR_LOG, line);
};

// ── Fetch full movie details + credits in ONE API call ────────

const fetchMovieWithCredits = async (tmdbId, retries = 3) => {
  const url = `${BASE_URL}/movie/${tmdbId}`;
  const params = {
    api_key: TMDB_API_KEY,
    append_to_response: "credits",
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sleep(DELAY_MS);
      const response = await axios.get(url, { params });
      return response.data;
    } catch (err) {
      if (err.response?.status === 429) {
        // Rate limited → wait 15 seconds and retry
        console.warn(`   ⚠️  Rate limited. Waiting 15s... (attempt ${attempt})`);
        await sleep(15000);
      } else if (err.response?.status === 404) {
        return null; // Movie not found, skip it
      } else {
        console.warn(`   ⚠️  Error for ${tmdbId}: ${err.message} (attempt ${attempt})`);
        await sleep(2000 * attempt);
      }
    }
  }
  return null;
};

// ── Save Person (upsert) ──────────────────────────────────────

const savePerson = async (tmdbPerson) => {
  const existing = await Person.findOne({ tmdb_id: tmdbPerson.id });
  if (existing) return existing;

  const person = new Person({
    tmdb_id: tmdbPerson.id,
    name: tmdbPerson.name,
    profile_path: tmdbPerson.profile_path
      ? `https://image.tmdb.org/t/p/w185${tmdbPerson.profile_path}`
      : null,
    known_for_department: tmdbPerson.known_for_department,
    gender: tmdbPerson.gender,
    popularity: tmdbPerson.popularity,
    movie_ids: [],
    tmdb_movie_credits: [],
  });

  await person.save();
  return person;
};

// ── Save MovieCast junction entry ─────────────────────────────

const saveMovieCast = async (movieDoc, personDoc, castMember, type) => {
  try {
    await MovieCast.findOneAndUpdate(
      { movie_id: movieDoc._id, person_id: personDoc._id },
      {
        movie_id: movieDoc._id,
        person_id: personDoc._id,
        tmdb_movie_id: movieDoc.tmdb_id,
        tmdb_person_id: personDoc.tmdb_id,
        character: castMember.character || castMember.job || "",
        department: castMember.department || "Acting",
        job: castMember.job || "Actor",
        order: castMember.order ?? 99,
        cast_type: type,
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Ignore duplicate key errors silently
    if (err.code !== 11000) logError(`MovieCast save error: ${err.message}`);
  }
};

// ── Process a single movie ────────────────────────────────────

const processMovie = async (movieEntry, index, total) => {
  const { tmdb_id, title } = movieEntry;
  console.log(`\n[${index + 1}/${total}] 🎬 ${title} (${tmdb_id})`);

  // Fetch full data from TMDB
  const data = await fetchMovieWithCredits(tmdb_id);
  if (!data) {
    console.log(`   ⚠️  Skipped (not found or error)`);
    logError(`SKIPPED tmdb_id=${tmdb_id} title="${title}"`);
    return null;
  }

  // ── Save Movie ──────────────────────────────────────────────
  let movieDoc = await Movie.findOne({ tmdb_id });

  if (!movieDoc) {
    const genres = data.genres?.map((g) => g.name) || [];
    const companies = data.production_companies?.map((c) => c.name) || [];
    const releaseYear = data.release_date
      ? parseInt(data.release_date.substring(0, 4))
      : null;

    movieDoc = new Movie({
      tmdb_id: data.id,
      title: data.title,
      original_title: data.original_title,
      release_year: releaseYear,
      release_date: data.release_date,
      overview: data.overview,
      poster_path: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      backdrop_path: data.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}`
        : null,
      genres,
      runtime: data.runtime,
      language: data.original_language,
      rating: data.vote_average,
      vote_count: data.vote_count,
      budget: data.budget,
      revenue: data.revenue,
      status: data.status,
      tagline: data.tagline,
      production_companies: companies,
      cast_ids: [],
      crew_ids: [],
    });

    await movieDoc.save();
    console.log(`   ✅ Movie saved`);
  } else {
    console.log(`   ⏭️  Movie already exists, updating cast...`);
  }

  // ── Process Cast ────────────────────────────────────────────
  const castList = data.credits?.cast?.slice(0, 20) || []; // top 20 cast
  const crewList = data.credits?.crew?.filter(
    (c) => ["Director", "Producer", "Music"].includes(c.job)
  ) || [];

  const castPersonIds = [];
  const crewPersonIds = [];

  // Save cast members
  for (const castMember of castList) {
    try {
      const personDoc = await savePerson(castMember);
      await saveMovieCast(movieDoc, personDoc, castMember, "cast");

      // Add movie to person's movie_ids (reverse mapping)
      await Person.findByIdAndUpdate(personDoc._id, {
        $addToSet: { movie_ids: movieDoc._id },
      });

      castPersonIds.push(personDoc._id);
    } catch (err) {
      logError(`Cast error for ${castMember.name}: ${err.message}`);
    }
  }

  // Save crew members (director, producer, music)
  for (const crewMember of crewList) {
    try {
      const personDoc = await savePerson(crewMember);
      await saveMovieCast(movieDoc, personDoc, crewMember, "crew");

      await Person.findByIdAndUpdate(personDoc._id, {
        $addToSet: { movie_ids: movieDoc._id },
      });

      crewPersonIds.push(personDoc._id);
    } catch (err) {
      logError(`Crew error for ${crewMember.name}: ${err.message}`);
    }
  }

  // Update movie with cast/crew IDs (forward mapping)
  await Movie.findByIdAndUpdate(movieDoc._id, {
    $addToSet: {
      cast_ids: { $each: castPersonIds },
      crew_ids: { $each: crewPersonIds },
    },
  });

  console.log(
    `   👥 Cast: ${castPersonIds.length} | Crew: ${crewPersonIds.length}`
  );
  return movieDoc._id;
};

// ── Main ──────────────────────────────────────────────────────

const run = async () => {
  console.log("🎬 PHASE 2: Fetching Movie Details + Cast");
  console.log("─".repeat(50));

  await connectDB();

  const checkpoint = loadCheckpoint();
  const allMovies = checkpoint.movieIds || [];

  if (allMovies.length === 0) {
    console.error("❌ No movie IDs found. Run fetchMoviesByYear.js first!");
    process.exit(1);
  }

  // Find already processed TMDB IDs
  const processedIds = new Set(checkpoint.processedTmdbIds || []);
  const toProcess = allMovies.filter((m) => !processedIds.has(m.tmdb_id));

  console.log(`📊 Total movies: ${allMovies.length}`);
  console.log(`✅ Already processed: ${processedIds.size}`);
  console.log(`⏳ Remaining: ${toProcess.length}`);
  console.log("─".repeat(50));

  let successCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const movie = toProcess[i];

    const result = await processMovie(movie, i, toProcess.length);

    if (result) {
      successCount++;
      processedIds.add(movie.tmdb_id);
    }

    // Save checkpoint every 50 movies
    if (i % 50 === 0) {
      checkpoint.processedTmdbIds = Array.from(processedIds);
      checkpoint.phase2Progress = { processed: i + 1, total: toProcess.length };
      saveCheckpoint(checkpoint);
      console.log(`\n💾 Checkpoint saved (${i + 1}/${toProcess.length})\n`);
    }
  }

  // Final checkpoint save
  checkpoint.processedTmdbIds = Array.from(processedIds);
  checkpoint.phase = 2;
  saveCheckpoint(checkpoint);

  console.log("\n" + "═".repeat(50));
  console.log(`✅ PHASE 2 COMPLETE!`);
  console.log(`📊 Successfully processed: ${successCount} movies`);
  console.log(`▶️  Now run: node scraper/buildReverseMapping.js`);
};

run().catch(console.error);
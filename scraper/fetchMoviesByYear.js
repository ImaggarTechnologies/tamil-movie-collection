// ============================================================
// PHASE 1: Discover all Tamil movie TMDB IDs year by year
// ============================================================

const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CHECKPOINT_FILE = path.join(__dirname, "checkpoint.json");
const BASE_URL = "https://api.themoviedb.org/3";

// Year range: 2024-03-31 back to 2020-01-01
const START_DATE = "2020-01-01";
const END_DATE = "2024-03-31";
const DELAY_MS = 300;

// ── Helpers ──────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadCheckpoint = () => {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  }
  return {
    phase: 1,
    movieIds: [],
    totalMoviesFound: 0,
    processedRanges: [], // Track completed day/month ranges if needed, but for now year is fine
  };
};

const saveCheckpoint = (data) => {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
};

// ── Fetch one page of Tamil movies for a date range ───────────

const fetchPage = async (startDate, endDate, page) => {
  const url = `${BASE_URL}/discover/movie`;
  const params = {
    api_key: TMDB_API_KEY,
    with_original_language: "ta",
    "primary_release_date.gte": startDate,
    "primary_release_date.lte": endDate,
    sort_by: "primary_release_date.desc",
    page,
  };

  const response = await axios.get(url, { params });
  return response.data;
};

// ── Fetch ALL pages for a given range ─────────────────────────

const fetchAllMoviesInRange = async (startDate, endDate) => {
  const movieIds = [];
  let page = 1;
  let totalPages = 1;

  try {
    do {
      await sleep(DELAY_MS);
      const data = await fetchPage(startDate, endDate, page);
      totalPages = data.total_pages;

      const ids = data.results.map((m) => ({
        tmdb_id: m.id,
        title: m.title,
        release_date: m.release_date,
        range: `${startDate}_to_${endDate}`
      }));

      movieIds.push(...ids);
      console.log(
        `   📄 Range ${startDate} - ${endDate} | Page ${page}/${totalPages} | Found ${ids.length} movies`
      );
      page++;
    } while (page <= totalPages);

    return movieIds;
  } catch (err) {
    console.error(`   ❌ Error fetching range ${startDate}-${endDate} page ${page}: ${err.message}`);
    return movieIds;
  }
};

// ── Main ──────────────────────────────────────────────────────

const run = async () => {
  console.log("🎬 PHASE 1: Fetching Tamil Movie IDs from TMDB (By Date Range)");
  console.log(`📅 Custom range: ${START_DATE} → ${END_DATE}`);
  console.log("─".repeat(50));

  if (!TMDB_API_KEY) {
    console.error("❌ TMDB_API_KEY not found in .env file!");
    process.exit(1);
  }

  const checkpoint = loadCheckpoint();
  const allMovieIds = checkpoint.movieIds || [];

  // Track existing TMDB IDs to avoid adding them twice to checkpoint
  const existingTmdbIds = new Set(allMovieIds.map(m => m.tmdb_id));

  console.log(`🔍 Fetching movies between ${START_DATE} and ${END_DATE}...`);
  const newMovies = await fetchAllMoviesInRange(START_DATE, END_DATE);

  // Filter out duplicates if any (though TMDB range shouldn't repeat if calls are clean)
  let count = 0;
  for (const movie of newMovies) {
    if (!existingTmdbIds.has(movie.tmdb_id)) {
      allMovieIds.push(movie);
      existingTmdbIds.add(movie.tmdb_id);
      count++;
    }
  }

  console.log(`\n✅ Fetch complete → ${count} new movies added to checkpoint`);

  // Save checkpoint
  checkpoint.movieIds = allMovieIds;
  checkpoint.totalMoviesFound = allMovieIds.length;
  checkpoint.phase = 1;
  saveCheckpoint(checkpoint);

  console.log("\n" + "═".repeat(50));
  console.log(`✅ PHASE 1 COMPLETE!`);
  console.log(`📊 Total Tamil Movies in Checkpoint: ${allMovieIds.length}`);
  console.log(`💾 Saved to checkpoint.json`);
  console.log(`▶️  Now run: node scraper/fetchMovieDetails.js`);
};

run().catch(console.error);

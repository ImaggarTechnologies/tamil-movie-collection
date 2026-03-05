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

// Year range: 2026 → 2024
const START_YEAR = 2026;
const END_YEAR = 2024;
const DELAY_MS = 300; 

// ── Helpers ──────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadCheckpoint = () => {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  }
  return {
    phase: 1,
    lastCompletedYear: null,
    movieIds: [],
    totalMoviesFound: 0,
    failedYears: [],
  };
};

const saveCheckpoint = (data) => {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
};

// ── Fetch one page of Tamil movies for a year ─────────────────

const fetchPage = async (year, page) => {
  const url = `${BASE_URL}/discover/movie`;
  const params = {
    api_key: TMDB_API_KEY,
    with_original_language: "ta",
    primary_release_year: year,
    sort_by: "primary_release_date.desc",
    page,
  };

  const response = await axios.get(url, { params });
  return response.data;
};

// ── Fetch ALL pages for a given year ─────────────────────────

const fetchAllMoviesForYear = async (year) => {
  const movieIds = [];
  let page = 1;
  let totalPages = 1;

  try {
    do {
      await sleep(DELAY_MS);
      const data = await fetchPage(year, page);
      totalPages = data.total_pages;

      const ids = data.results.map((m) => ({
        tmdb_id: m.id,
        title: m.title,
        release_date: m.release_date,
        year,
      }));

      movieIds.push(...ids);
      console.log(
        `   📄 Year ${year} | Page ${page}/${totalPages} | Found ${ids.length} movies`
      );
      page++;
    } while (page <= totalPages);

    return movieIds;
  } catch (err) {
    console.error(`   ❌ Error fetching year ${year} page ${page}: ${err.message}`);
    return movieIds; // return what we got so far
  }
};

// ── Main ──────────────────────────────────────────────────────

const run = async () => {
  console.log("🎬 PHASE 1: Fetching Tamil Movie IDs from TMDB");
  console.log(`📅 Year range: ${START_YEAR} → ${END_YEAR}`);
  console.log("─".repeat(50));

  if (!TMDB_API_KEY) {
    console.error("❌ TMDB_API_KEY not found in .env file!");
    process.exit(1);
  }

  const checkpoint = loadCheckpoint();
  const allMovieIds = checkpoint.movieIds || [];
  const completedYears = new Set(
    allMovieIds.map((m) => m.year)
  );

  let totalFound = checkpoint.totalMoviesFound || 0;

  for (let year = START_YEAR; year >= END_YEAR; year--) {
    // Skip already completed years (resume support)
    if (completedYears.has(year)) {
      console.log(`⏭️  Year ${year} already fetched, skipping...`);
      continue;
    }

    console.log(`\n🔍 Fetching year: ${year}`);
    const movies = await fetchAllMoviesForYear(year);

    allMovieIds.push(...movies);
    totalFound += movies.length;

    console.log(`   ✅ Year ${year} complete → ${movies.length} movies found`);

    // Save checkpoint after every year
    checkpoint.movieIds = allMovieIds;
    checkpoint.totalMoviesFound = totalFound;
    checkpoint.lastCompletedYear = year;
    checkpoint.phase = 1;
    saveCheckpoint(checkpoint);
  }

  console.log("\n" + "═".repeat(50));
  console.log(`✅ PHASE 1 COMPLETE!`);
  console.log(`📊 Total Tamil Movies Found: ${totalFound}`);
  console.log(`💾 Saved to checkpoint.json`);
  console.log(`▶️  Now run: node scraper/fetchMovieDetails.js`);
};

run().catch(console.error);
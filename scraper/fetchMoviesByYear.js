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
const START_DATE = "2000-01-01";
const END_DATE = "2004-12-31";
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

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (err) {
      if (attempt < 3) {
        console.log(`   ⚠️  Attempt ${attempt} failed, retrying in ${attempt * 2}s...`);
        await sleep(attempt * 2000);
      } else {
        throw err;
      }
    }
  }
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
    throw err;
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
  const existingTmdbIds = new Set(allMovieIds.map(m => m.tmdb_id));
  const completedRanges = new Set(checkpoint.processedRanges || []);

  // Split into monthly chunks
  const startD = new Date(START_DATE);
  const endD = new Date(END_DATE);
  const months = [];

  let cursor = new Date(startD);
  while (cursor <= endD) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0); // last day of month
    const actualEnd = monthEnd > endD ? endD : monthEnd;

    const startStr = monthStart.toISOString().slice(0, 10);
    const endStr = actualEnd.toISOString().slice(0, 10);
    months.push({ start: startStr, end: endStr });

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1); // first day of next month
  }

  console.log(`📆 Split into ${months.length} monthly chunks\n`);

  let totalNew = 0;

  for (let i = 0; i < months.length; i++) {
    const { start, end } = months[i];
    const rangeKey = `${start}_${end}`;

    if (completedRanges.has(rangeKey)) {
      console.log(`⏭️  [${i + 1}/${months.length}] ${start} → ${end} (already done, skipping)`);
      continue;
    }

    console.log(`\n🔍 [${i + 1}/${months.length}] Fetching: ${start} → ${end}`);

    try {
      const newMovies = await fetchAllMoviesInRange(start, end);

      let count = 0;
      for (const movie of newMovies) {
        if (!existingTmdbIds.has(movie.tmdb_id)) {
          allMovieIds.push(movie);
          existingTmdbIds.add(movie.tmdb_id);
          count++;
        }
      }
      totalNew += count;
      console.log(`   ✅ ${count} new movies added`);

      // Mark range as done and save after each month
      completedRanges.add(rangeKey);
      checkpoint.movieIds = allMovieIds;
      checkpoint.totalMoviesFound = allMovieIds.length;
      checkpoint.processedRanges = [...completedRanges];
      checkpoint.phase = 1;
      saveCheckpoint(checkpoint);
    } catch (err) {
      console.error(`   ❌ Error on ${start} → ${end}: ${err.message}`);
      console.log(`   💡 Progress saved. Re-run to retry this month.`);
      // Save what we have so far
      checkpoint.movieIds = allMovieIds;
      checkpoint.totalMoviesFound = allMovieIds.length;
      checkpoint.processedRanges = [...completedRanges];
      saveCheckpoint(checkpoint);
    }
  }

  console.log("\n" + "═".repeat(50));
  console.log(`✅ PHASE 1 COMPLETE!`);
  console.log(`📊 ${totalNew} new movies added | Total in Checkpoint: ${allMovieIds.length}`);
  console.log(`💾 Saved to checkpoint.json`);
  console.log(`▶️  Now run: node scraper/fetchMovieDetails.js`);
};

run().catch(console.error);

// ============================================================
// MASTER SCRIPT
// ============================================================

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const CHECKPOINT_FILE = path.join(__dirname, "checkpoint.json");

const log = (msg) => console.log(`\n${"═".repeat(50)}\n${msg}\n${"═".repeat(50)}`);

const runScript = (scriptPath, label) => {
  log(`▶️  Starting: ${label}`);
  try {
    execSync(`node ${scriptPath}`, { stdio: "inherit" });
    log(`✅ Completed: ${label}`);
  } catch (err) {
    console.error(`\n❌ Error in ${label}: ${err.message}`);
    console.error(`💡 Fix the error and re-run. Progress is saved in checkpoint.json`);
    process.exit(1);
  }
};

const getCheckpoint = () => {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  }
  return { phase: 0 };
};

const run = async () => {
  console.clear();
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     🎬 TAMIL MOVIES DB - DATA COLLECTION         ║");
  console.log("║     Running all phases...                        ║");
  console.log("╚══════════════════════════════════════════════════╝");

  const checkpoint = getCheckpoint();
  const startTime = Date.now();

  // ── PHASE 1: Discover all Tamil movie IDs ──────────────────
  if (!checkpoint.movieIds || checkpoint.movieIds.length === 0) {
    runScript(
      path.join(__dirname, "fetchMoviesByYear.js"),
      "PHASE 1: Discover Tamil Movie IDs"
    );
  } else {
    console.log(
      `\n⏭️  PHASE 1 already done (${checkpoint.movieIds.length} movies found). Skipping...`
    );
  }

  // ── PHASE 2: Fetch full details + cast ─────────────────────
  const processedCount = checkpoint.processedTmdbIds?.length || 0;
  const totalMovies = checkpoint.movieIds?.length || 0;

  if (processedCount < totalMovies) {
    runScript(
      path.join(__dirname, "fetchMovieDetails.js"),
      "PHASE 2: Fetch Movie Details + Cast"
    );
  } else {
    console.log(`\n⏭️  PHASE 2 already done (${processedCount} movies processed). Skipping...`);
  }

  // ── PHASE 3: Build reverse mapping ─────────────────────────
  runScript(
    path.join(__dirname, "buildReverseMapping.js"),
    "PHASE 3: Build Reverse Mapping (Person → Movies)"
  );

  // ── Done! ───────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  🎉 ALL PHASES COMPLETE!                         ║");
  console.log(`║  ⏱️  Total time: ${elapsed} minutes`.padEnd(51) + "║");
  console.log("║                                                  ║");
  console.log("║  ✅ MongoDB is fully populated!                  ║");
  console.log("║  ✅ Forward mapping:  movie → cast               ║");
  console.log("║  ✅ Reverse mapping:  person → all movies        ║");
  console.log("║                                                  ║");
  console.log("║  Next step: Build the Express API!               ║");
  console.log("╚══════════════════════════════════════════════════╝");
};

run().catch(console.error);
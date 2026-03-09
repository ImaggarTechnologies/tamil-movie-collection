// ============================================================
// Retry only the skipped/failed movies from errors.log
// ============================================================

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const Movie = require("../models/Movie");
const Person = require("../models/Person");
const MovieCast = require("../models/MovieCast");
const axios = require("axios");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const ERROR_LOG = path.join(__dirname, "../logs/errors.log");
const DELAY_MS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Parse SKIPPED entries from errors.log
const getSkippedIds = () => {
    if (!fs.existsSync(ERROR_LOG)) return [];
    const lines = fs.readFileSync(ERROR_LOG, "utf-8").split("\n");
    const ids = [];
    for (const line of lines) {
        const match = line.match(/SKIPPED tmdb_id=(\d+) title="(.+?)"/);
        if (match) {
            ids.push({ tmdb_id: parseInt(match[1]), title: match[2] });
        }
    }
    return ids;
};

const fetchMovieWithCredits = async (tmdbId) => {
    try {
        await sleep(DELAY_MS);
        const response = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
            params: { api_key: TMDB_API_KEY, append_to_response: "credits" },
        });
        return response.data;
    } catch (err) {
        return null;
    }
};

const savePerson = async (tmdbPerson) => {
    let person = await Person.findOne({ tmdb_id: tmdbPerson.id });
    if (!person) {
        person = new Person({
            tmdb_id: tmdbPerson.id,
            name: tmdbPerson.name,
            profile_path: tmdbPerson.profile_path
                ? `https://image.tmdb.org/t/p/w185${tmdbPerson.profile_path}`
                : null,
            known_for_department: tmdbPerson.known_for_department,
        });
        await person.save();
    }
    return person;
};

const run = async () => {
    console.log("🔄 Retrying skipped movies from errors.log");
    console.log("─".repeat(50));

    const skipped = getSkippedIds();
    if (skipped.length === 0) {
        console.log("✅ No skipped movies found in errors.log!");
        return;
    }

    console.log(`📋 Found ${skipped.length} skipped movies to retry\n`);
    await connectDB();

    let success = 0, failed = 0;

    for (let i = 0; i < skipped.length; i++) {
        const { tmdb_id, title } = skipped[i];
        console.log(`[${i + 1}/${skipped.length}] 🎬 ${title} (${tmdb_id})`);

        // Skip if already in DB
        const exists = await Movie.findOne({ tmdb_id });
        if (exists) {
            console.log(`   ⏭️  Already in DB, skipping`);
            success++;
            continue;
        }

        const data = await fetchMovieWithCredits(tmdb_id);
        if (!data) {
            console.log(`   ❌ Still not available on TMDB`);
            failed++;
            continue;
        }

        // Save movie
        const genres = data.genres?.map((g) => g.name) || [];
        const companies = data.production_companies?.map((c) => c.name) || [];
        const releaseYear = data.release_date ? parseInt(data.release_date.substring(0, 4)) : null;

        const movieDoc = new Movie({
            tmdb_id: data.id, title: data.title, original_title: data.original_title,
            release_year: releaseYear, release_date: data.release_date, overview: data.overview,
            poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            backdrop_path: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : null,
            genres, runtime: data.runtime, language: data.original_language,
            rating: data.vote_average, vote_count: data.vote_count,
            budget: data.budget, revenue: data.revenue, status: data.status,
            tagline: data.tagline, production_companies: companies,
            cast_ids: [], crew_ids: [],
        });
        await movieDoc.save();

        // Save cast (top 20)
        const castList = data.credits?.cast?.slice(0, 20) || [];
        for (const c of castList) {
            try {
                const personDoc = await savePerson(c);
                await Person.findByIdAndUpdate(personDoc._id, { $addToSet: { movie_ids: movieDoc._id } });
                await Movie.findByIdAndUpdate(movieDoc._id, { $addToSet: { cast_ids: personDoc._id } });
            } catch (err) { /* skip */ }
        }

        console.log(`   ✅ Saved! (${castList.length} cast members)`);
        success++;
    }

    console.log("\n" + "═".repeat(50));
    console.log(`✅ Done! Saved: ${success} | Still failed: ${failed}`);
    process.exit(0);
};

run().catch(console.error);

// ============================================================
// Retry skipped movies & persons from errors.log
// Successfully retried entries are removed from the log
// ============================================================

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const Movie = require("../models/Movie");
const Person = require("../models/Person");
const axios = require("axios");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const ERROR_LOG = path.join(__dirname, "../logs/errors.log");
const DELAY_MS = 350;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Parse errors.log ──────────────────────────────────────────

const parseErrorLog = () => {
    if (!fs.existsSync(ERROR_LOG)) return [];
    const lines = fs.readFileSync(ERROR_LOG, "utf-8").split("\n").filter(Boolean);
    return lines.map((line) => {
        const movieMatch = line.match(/SKIPPED tmdb_id=(\d+) title="(.+?)"/);
        if (movieMatch) {
            return { type: "movie", tmdb_id: parseInt(movieMatch[1]), name: movieMatch[2], line };
        }
        const personMatch = line.match(/Person not found: tmdb_id=(\d+) name="(.+?)"/);
        if (personMatch) {
            return { type: "person", tmdb_id: parseInt(personMatch[1]), name: personMatch[2], line };
        }
        return { type: "unknown", line };
    });
};

// ── TMDB fetch helpers ────────────────────────────────────────

const fetchMovie = async (tmdbId) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await sleep(DELAY_MS);
            const res = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
                params: { api_key: TMDB_API_KEY, append_to_response: "credits" },
            });
            return res.data;
        } catch (err) {
            if (err.response?.status === 404) return null;
            if (attempt < 3) await sleep(2000 * attempt);
            else return null;
        }
    }
};

const fetchPerson = async (tmdbId) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await sleep(DELAY_MS);
            const res = await axios.get(`${BASE_URL}/person/${tmdbId}`, {
                params: { api_key: TMDB_API_KEY },
            });
            return res.data;
        } catch (err) {
            if (err.response?.status === 404) return null;
            if (attempt < 3) await sleep(2000 * attempt);
            else return null;
        }
    }
};

// ── Save helpers ──────────────────────────────────────────────

const saveMovie = async (data) => {
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
            let person = await Person.findOne({ tmdb_id: c.id });
            if (!person) {
                person = new Person({
                    tmdb_id: c.id, name: c.name,
                    profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
                    known_for_department: c.known_for_department,
                });
                await person.save();
            }
            await Person.findByIdAndUpdate(person._id, { $addToSet: { movie_ids: movieDoc._id } });
            await Movie.findByIdAndUpdate(movieDoc._id, { $addToSet: { cast_ids: person._id } });
        } catch (err) { /* skip */ }
    }

    return castList.length;
};

// ── Main ──────────────────────────────────────────────────────

const run = async () => {
    console.log("🔄 Retrying failed entries from errors.log");
    console.log("─".repeat(50));

    const entries = parseErrorLog();
    if (entries.length === 0) {
        console.log("✅ errors.log is empty — nothing to retry!");
        return;
    }

    const movies = entries.filter((e) => e.type === "movie");
    const persons = entries.filter((e) => e.type === "person");
    const unknown = entries.filter((e) => e.type === "unknown");

    console.log(`📋 Movies to retry: ${movies.length}`);
    console.log(`👤 Persons to retry: ${persons.length}`);
    if (unknown.length) console.log(`❓ Unknown entries: ${unknown.length}`);
    console.log("─".repeat(50));

    await connectDB();

    const resolvedLines = new Set(); // lines to remove from log

    // ── Retry Movies ────────────────────────────────────────────
    for (let i = 0; i < movies.length; i++) {
        const { tmdb_id, name, line } = movies[i];
        console.log(`\n[${i + 1}/${movies.length}] 🎬 ${name} (${tmdb_id})`);

        // Already in DB?
        const exists = await Movie.findOne({ tmdb_id });
        if (exists) {
            console.log(`   ✅ Already in DB — removing from log`);
            resolvedLines.add(line);
            continue;
        }

        const data = await fetchMovie(tmdb_id);
        if (!data) {
            console.log(`   ❌ Still unavailable on TMDB`);
            continue;
        }

        const castCount = await saveMovie(data);
        console.log(`   ✅ Saved! (${castCount} cast members)`);
        resolvedLines.add(line);
    }

    // ── Retry Persons ───────────────────────────────────────────
    if (persons.length > 0) {
        console.log("\n" + "─".repeat(50));
        console.log("👤 Retrying persons...\n");
    }

    for (let i = 0; i < persons.length; i++) {
        const { tmdb_id, name, line } = persons[i];
        console.log(`[${i + 1}/${persons.length}] 👤 ${name} (${tmdb_id})`);

        // Already has data in DB?
        const existingPerson = await Person.findOne({ tmdb_id });
        if (existingPerson && existingPerson.tmdb_movie_credits && existingPerson.tmdb_movie_credits.length > 0) {
            console.log(`   ✅ Already mapped — removing from log`);
            resolvedLines.add(line);
            continue;
        }

        const data = await fetchPerson(tmdb_id);
        if (!data) {
            console.log(`   ❌ Still not found on TMDB`);
            continue;
        }

        // Update or create person
        const updateData = {
            biography: data.biography,
            birthday: data.birthday,
            deathday: data.deathday,
            birthplace: data.place_of_birth,
            popularity: data.popularity,
        };
        if (data.profile_path) {
            updateData.profile_path = `https://image.tmdb.org/t/p/w185${data.profile_path}`;
        }

        if (existingPerson) {
            await Person.findByIdAndUpdate(existingPerson._id, updateData);
        } else {
            const newPerson = new Person({ tmdb_id, name, ...updateData });
            await newPerson.save();
        }

        console.log(`   ✅ Person saved/updated`);
        resolvedLines.add(line);
    }

    // ── Clean up errors.log ─────────────────────────────────────
    const remainingLines = entries
        .filter((e) => !resolvedLines.has(e.line))
        .map((e) => e.line);

    fs.writeFileSync(ERROR_LOG, remainingLines.length > 0 ? remainingLines.join("\n") + "\n" : "");

    console.log("\n" + "═".repeat(50));
    console.log(`✅ Done!`);
    console.log(`📊 Resolved: ${resolvedLines.size} | Remaining: ${remainingLines.length}`);
    if (remainingLines.length === 0) {
        console.log(`🎉 errors.log is now clean!`);
    }
    process.exit(0);
};

run().catch(console.error);

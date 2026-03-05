const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const movieRoutes = require("./routes/movies");
const personRoutes = require("./routes/persons");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ── Routes ────────────────────────────────────────────────────
app.use("/api/movies", movieRoutes);
app.use("/api/persons", personRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🎬 Tamil Movies API is running!",
    endpoints: {
      movies: "/api/movies",
      movieById: "/api/movies/:id",
      searchMovies: "/api/movies/search?q=leo",
      personById: "/api/persons/:id",
      searchPersons: "/api/persons/search?q=vijay",
    },
  });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on → http://localhost:${PORT}`);
});
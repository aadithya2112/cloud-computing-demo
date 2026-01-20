require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
});

// Initialize DB
async function initDB() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS urls (
          id SERIAL PRIMARY KEY,
          original_url TEXT NOT NULL,
          short_code TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            console.log("Database initialized");
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error initializing database:", err);
    }
}

initDB();

// Helper to generate short code
function generateShortCode() {
    return Math.random().toString(36).substring(2, 8);
}

// Shorten URL endpoint
app.post("/shorten", async (req, res) => {
    const { originalUrl } = req.body;
    if (!originalUrl) {
        return res.status(400).json({ error: "originalUrl is required" });
    }

    try {
        const shortCode = generateShortCode();
        const result = await pool.query(
            "INSERT INTO urls (original_url, short_code) VALUES ($1, $2) RETURNING short_code, original_url",
            [originalUrl, shortCode]
        );
        const newUrl = result.rows[0];
        const fullShortUrl = `${req.protocol}://${req.get("host")}/${newUrl.short_code}`;
        res.json({ shortCode: newUrl.short_code, shortUrl: fullShortUrl });
    } catch (err) {
        console.error("Error creating short URL:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Redirect endpoint
app.get("/:shortCode", async (req, res) => {
    const { shortCode } = req.params;

    try {
        const result = await pool.query(
            "SELECT original_url FROM urls WHERE short_code = $1",
            [shortCode]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "URL not found" });
        }

        res.redirect(result.rows[0].original_url);
    } catch (err) {
        console.error("Error retrieving URL:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
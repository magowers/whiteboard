import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import helmet from "helmet";
import cors from "cors";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// If running behind a proxy (Railway, Netlify proxies, etc.) enable trust proxy
app.set("trust proxy", 1);
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, "whiteboard.db"), (err) => {
  if (err) {
    console.error("Database error:", err);
  } else {
    console.log("Connected to SQLite database");
    // Create table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE DEFAULT 'main',
        data TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^https:\/\/.*\.netlify\.app$/.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // For cross-site cookies (Netlify frontend calling Railway backend) we need
      // SameSite=None and secure=true in production. `trust proxy` must be set
      // so Express knows it's behind HTTPS when setting the secure flag.
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// TEMPORARY — we will replace this with a real hash later
const PASSWORD_HASH = process.env.PASSWORD_HASH;

app.post("/login", async (req, res) => {
  const { password } = req.body;

  const ok = await bcrypt.compare(password, PASSWORD_HASH);
  if (!ok) return res.status(401).json({ error: "Wrong password" });

  req.session.authenticated = true;
  res.json({ success: true });
});

app.get("/check", (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Get whiteboard document
app.get("/api/document", (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  db.get(
    "SELECT data FROM documents WHERE name = 'main'",
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ data: row ? JSON.parse(row.data) : null });
    }
  );
});

// Save whiteboard document
app.post("/api/document", (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: "No data provided" });
  }

  db.run(
    `INSERT INTO documents (name, data, updated_at) 
     VALUES ('main', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(name) DO UPDATE SET 
     data = excluded.data,
     updated_at = CURRENT_TIMESTAMP`,
    [JSON.stringify(data)],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ success: true });
    }
  );
});

app.listen(4000, () => console.log("Backend running on port 4000"));

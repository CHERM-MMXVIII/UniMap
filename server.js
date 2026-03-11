// Load environment variables (optional but recommended)
// Uncomment these lines after installing dotenv: npm install dotenv
// require('dotenv').config();

console.log("✅ RUNNING SERVER.JS FROM:", __dirname);
const express = require("express");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */
// Serve static folders
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/img", express.static(path.join(__dirname, "img")));
// Serve uploaded profile pictures
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   MULTER - PROFILE PICTURE
========================= */
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads", "profiles");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Name file by username to auto-overwrite on re-upload
    const username = req.body.username || "unknown";
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${username}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

// MAIN PAGE 
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "login-form.html"));
});

// CREATE ACCOUNT PAGE
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "createacc-form.html"));
});

// ACCOUNT SETTINGS
app.get("/accountsettings", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "acc-settings.html"));
});

// PEOPLE BEHIND CHERM
app.get("/orgchart", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "org-chart.html"));
});

// FEEDBACK
app.get("/feedback", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "feedback-form.html"));
});

// DASHBOARD
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "dashboard.html"));
});


/* =========================
   DATABASE CONFIGURATION
========================= */
// Option 1: Using environment variables (recommended for production)
// const pool = new Pool({
//   user: process.env.DB_USER || "postgres",
//   host: process.env.DB_HOST || "localhost",
//   database: process.env.DB_NAME || "unimap_db",
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT || 5433
// });

// Option 2: Direct configuration (current setup)
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "unimap_db",
  password: "Cherm.G1s",  // ⚠️ CHANGE THIS to your PostgreSQL password
  port: 5433               // ⚠️ CHECK YOUR PORT (usually 5432 or 5433)
});

// Test database connection
pool.query("SELECT NOW()")
  .then(r => console.log("✅ DB connected:", r.rows[0].now))
  .catch(e => {
    console.error("❌ DB connection error:", e.message);
    console.error("💡 Check your database settings:");
    console.error("   - Is PostgreSQL running?");
    console.error("   - Does database 'unimap_db' exist?");
    console.error("   - Is the password correct?");
    console.error("   - Is the port correct?");
  });

/* =========================
   ROUTES
========================= */

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
   REGISTER API
========================= */
app.post("/api/register", async (req, res) => {
  const { fullname, email, username, password, confirmPassword } = req.body;

  // Validation
  if (!fullname || !email || !username || !password || !confirmPassword) {
    return res.json({ success: false, message: "All fields required" });
  }

  if (password !== confirmPassword) {
    return res.json({ success: false, message: "Passwords do not match" });
  }

  // Basic password strength check
  if (password.length < 6) {
    return res.json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    // Check if username already exists
    const userExists = await pool.query(
      "SELECT 1 FROM users WHERE username=$1",
      [username]
    );

    if (userExists.rows.length) {
      return res.json({ success: false, message: "Username already exists" });
    }

    // Check if email already exists
    const emailExists = await pool.query(
      "SELECT 1 FROM users WHERE email=$1",
      [email]
    );

    if (emailExists.rows.length) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert new user
    await pool.query(
      "INSERT INTO users(fullname, email, username, password) VALUES($1,$2,$3,$4)",
      [fullname, email, username, hash]
    );

    console.log("✅ New user registered:", username);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.json({ success: false, message: "Server error during registration" });
  }
});


/* =========================
   LOGIN API
========================= */
app.post("/api/login", async (req, res) => {
  console.log("🔐 LOGIN REQUEST:", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "Username and password required" });
  }

  try {
    // Find user by username
    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (!result.rows.length) {
      return res.json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];

    // Compare password with hash
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ success: false, message: "Wrong password" });
    }

    // Successful login
    console.log("✅ User logged in:", username);
    res.json({
      success: true,
      user: {
        fullname: user.fullname,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.json({ success: false, message: "Login failed" });
  }
});

/* =========================
   GET PROFILE API
   Fetches user info + profile picture URL from DB
========================= */
app.get("/api/profile", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.json({ success: false, message: "Username required" });
  }

  try {
    // ✅ Auto-add profile_picture column if it doesn't exist yet
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT
    `);

    const result = await pool.query(
      "SELECT fullname, username, email, profile_picture FROM users WHERE username=$1",
      [username]
    );

    if (!result.rows.length) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    console.error("❌ Get profile error:", err);
    res.json({ success: false, message: "Server error" });
  }
});


/* =========================
   UPLOAD PROFILE PICTURE API
========================= */
app.post("/api/upload-picture", upload.single("picture"), async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.json({ success: false, message: "Username required" });
  }

  if (!req.file) {
    return res.json({ success: false, message: "No file uploaded" });
  }

  // Build public URL path to the saved file
  const picturePath = `/uploads/profiles/${req.file.filename}`;

  try {
    // ✅ Ensure column exists before updating
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT`);

    await pool.query(
      "UPDATE users SET profile_picture=$1 WHERE username=$2",
      [picturePath, username]
    );

    console.log("✅ Profile picture updated for:", username);
    res.json({ success: true, pictureUrl: picturePath });

  } catch (err) {
    console.error("❌ Upload picture error:", err);
    res.json({ success: false, message: "Failed to save picture to database" });
  }
});


/* =========================
   REMOVE PROFILE PICTURE API
========================= */
app.post("/api/remove-picture", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.json({ success: false, message: "Username required" });
  }

  try {
    // Get current picture path to delete the file
    const result = await pool.query(
      "SELECT profile_picture FROM users WHERE username=$1",
      [username]
    );

    if (result.rows.length && result.rows[0].profile_picture) {
      const filePath = path.join(__dirname, result.rows[0].profile_picture);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Clear from DB
    await pool.query(
      "UPDATE users SET profile_picture=NULL WHERE username=$1",
      [username]
    );

    console.log("✅ Profile picture removed for:", username);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Remove picture error:", err);
    res.json({ success: false, message: "Failed to remove picture" });
  }
});


/* =========================
   CHANGE PASSWORD API
========================= */
app.post("/api/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.json({ success: false, message: "All fields required" });
  }

  if (newPassword.length < 6) {
    return res.json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    const result = await pool.query(
      "SELECT password FROM users WHERE username=$1",
      [username]
    );

    if (!result.rows.length) {
      return res.json({ success: false, message: "User not found" });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!match) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    // Hash and save new password
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password=$1 WHERE username=$2",
      [hash, username]
    );

    console.log("✅ Password changed for:", username);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Change password error:", err);
    res.json({ success: false, message: "Server error" });
  }
});


/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📍 Login page: http://localhost:${PORT}/login`);
  console.log(`📍 Register page: http://localhost:${PORT}/register`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('💾 Database pool has ended');
  });
});
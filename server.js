require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const POSTS_FILE = path.join(__dirname, "posts.json");
const ALBUM_DIR = path.join(__dirname, "albums");

app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE"], credentials: true }));
app.use(express.json());
app.use("/albums", express.static(ALBUM_DIR));

const upload = multer({ dest: path.join(ALBUM_DIR) });

function readPosts() {
  if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, "[]");
  return JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
}

function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// --- AUTH ---
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing token" });
  const token = header.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// --- POSTS ---
app.get("/api/posts", (req, res) => {
  res.json(readPosts());
});

app.post("/api/posts", authMiddleware, (req, res) => {
  const { title, date, content, images } = req.body;
  const posts = readPosts();
  const newPost = {
    id: uuidv4(),
    title,
    date,
    content,
    images: images || [],
    createdAt: Date.now()
  };
  posts.unshift(newPost);
  writePosts(posts);
  res.json({ success: true, post: newPost });
});

app.put("/api/posts/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  posts[idx] = { ...posts[idx], ...req.body };
  writePosts(posts);
  res.json({ success: true });
});

app.delete("/api/posts/:id", authMiddleware, (req, res) => {
  const posts = readPosts().filter(p => p.id !== req.params.id);
  writePosts(posts);
  res.json({ success: true });
});

// --- IMAGE UPLOAD ---
app.post("/api/upload", authMiddleware, upload.array("images"), (req, res) => {
  const files = req.files.map(f => ({
    filename: f.filename,
    url: `/albums/${f.filename}`
  }));
  res.json({ success: true, files });
});

// --- BACKUP / RESTORE ---
app.get("/api/backup", authMiddleware, (req, res) => {
  res.download(POSTS_FILE);
});

app.post("/api/restore", authMiddleware, (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "Body must be array" });
  writePosts(req.body);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));

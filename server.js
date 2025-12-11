require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const POSTS_FILE = path.join(__dirname, "posts.json");

const app = express();

// CORS for your frontend domains
app.use(cors({
  origin: [
    "https://unknownurbexer.blog",
    "https://unkn0wn.cyb3r.br4t", 
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

// File for storing posts
function readPosts() {
  if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, "[]");
  return JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
}

function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// Auth
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// CRUD
app.get("/api/posts", (req, res) => {
  res.json(readPosts());
});

app.post("/api/posts", authMiddleware, multer().none(), (req, res) => {
  const { title, date, content } = req.body;
  if (!title || !date || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const posts = readPosts();
  const newPost = { id: uuidv4(), title, date, content, images: [] };
  posts.unshift(newPost);
  writePosts(posts);
  res.json({ success: true, post: newPost });
});

app.put("/api/posts/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, date, content } = req.body;
  const posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  posts[idx] = { ...posts[idx], title, date, content };
  writePosts(posts);
  res.json({ success: true });
});

app.delete("/api/posts/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const posts = readPosts().filter(p => p.id !== id);
  writePosts(posts);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

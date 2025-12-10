// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'explore2025';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const POSTS_FILE = path.join(__dirname, 'posts.json');

// Create express app FIRST
const app = express();

// Apply CORRECT CORS settings once
app.use(cors({
    origin: [
        "https://unknownklh-jpg.github.io",
        "https://unknownurbexer.blog"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '2mb' }));

// Post storage helpers
function readPosts() {
    if (!fs.existsSync(POSTS_FILE)) {
        fs.writeFileSync(POSTS_FILE, JSON.stringify([]), 'utf8');
    }
    return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8') || "[]");
}

function writePosts(posts) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 4), 'utf8');
}

if (!fs.existsSync(POSTS_FILE)) writePosts([]);

/* -------------------------------
   AUTH: login → returns JWT
   ------------------------------- */
app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Missing password" });

    // Bcrypt support
    if (ADMIN_PASSWORD.startsWith("$2")) {
        const ok = await bcrypt.compare(password, ADMIN_PASSWORD);
        if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    } else {
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
});

/* -------------------------------
   AUTH middleware
   ------------------------------- */
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing token" });

    try {
        req.user = jwt.verify(match[1], JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

/* -------------------------------
   POSTS API
   ------------------------------- */
app.get('/api/posts', (req, res) => {
    const posts = readPosts().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(posts);
});

app.post('/api/posts', authMiddleware, (req, res) => {
    const { title, date, content } = req.body;
    if (!title || !date || !content) return res.status(400).json({ error: "Missing fields" });

    const posts = readPosts();
    const newPost = {
        id: uuidv4(),
        title,
        date,
        content,
        createdAt: Date.now()
    };
    posts.unshift(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
});

app.put('/api/posts/:id', authMiddleware, (req, res) => {
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Post not found" });

    const { title, date, content } = req.body;
    if (!title || !date || !content) return res.status(400).json({ error: "Missing fields" });

    posts[idx] = { ...posts[idx], title, date, content, updatedAt: Date.now() };
    writePosts(posts);
    res.json(posts[idx]);
});

app.delete('/api/posts/:id', authMiddleware, (req, res) => {
    let posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Post not found" });

    const removed = posts.splice(idx, 1)[0];
    writePosts(posts);
    res.json({ deleted: removed });
});

/* -------------------------------
   EXPORT / IMPORT
   ------------------------------- */
app.get('/api/export', authMiddleware, (req, res) => {
    const posts = readPosts();
    res.setHeader("Content-Disposition", 'attachment; filename="urbanPosts_backup.json"');
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(posts, null, 4));
});

app.post('/api/import', authMiddleware, (req, res) => {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: "Body must be an array" });

    const cleaned = req.body.map(p => ({
        id: p.id || uuidv4(),
        title: p.title || "Untitled",
        date: p.date || "",
        content: p.content || "",
        createdAt: p.createdAt || Date.now(),
        updatedAt: p.updatedAt || null
    }));

    writePosts(cleaned);
    res.json({ imported: cleaned.length });
});

/* -------------------------------
   Start Server
   ------------------------------- */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


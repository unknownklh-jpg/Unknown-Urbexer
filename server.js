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

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors()); // Allow cross-origin for quick setup. In production restrict origins.

// Simple file-based storage helpers
function readPosts() {
    try {
        if (!fs.existsSync(POSTS_FILE)) {
            fs.writeFileSync(POSTS_FILE, JSON.stringify([]), 'utf8');
        }
        const raw = fs.readFileSync(POSTS_FILE, 'utf8');
        return JSON.parse(raw || '[]');
    } catch (err) {
        console.error('Error reading posts:', err);
        return [];
    }
}

function writePosts(posts) {
    try {
        fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 4), 'utf8');
    } catch (err) {
        console.error('Error writing posts:', err);
    }
}

// Create posts.json if missing
if (!fs.existsSync(POSTS_FILE)) writePosts([]);

/* -------------------------------
   AUTH: login -> returns JWT
   ------------------------------- */

app.post('/api/login', async (req, res) => {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Missing password' });

    // For stronger security, hash the ADMIN_PASSWORD and compare using bcrypt.
    // Here we do a bcrypt compare so you can store a bcrypt-hashed ADMIN_PASSWORD if desired.
    // If ADMIN_PASSWORD is plain text, compare directly for backward compatibility.
    try {
        // If stored password looks like a bcrypt hash (starts with $2), compare with bcrypt.
        if (ADMIN_PASSWORD.startsWith('$2')) {
            const ok = await bcrypt.compare(password, ADMIN_PASSWORD);
            if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        } else {
            if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
    } catch (err) {
        console.error('Login error', err);
        return res.status(500).json({ error: 'Internal error' });
    }
});

/* -------------------------------
   AUTH middleware
   ------------------------------- */

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const m = header.match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: 'Missing token' });
    const token = m[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

/* -------------------------------
   POSTS API (public GET)
   ------------------------------- */

// Get all posts (public)
app.get('/api/posts', (req, res) => {
    const posts = readPosts();
    // return newest first (descending by createdAt)
    posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(posts);
});

/* -------------------------------
   CREATE post (protected)
   ------------------------------- */
app.post('/api/posts', authMiddleware, (req, res) => {
    const { title, date, content } = req.body || {};
    if (!title || !date || !content) {
        return res.status(400).json({ error: 'Missing fields (title, date, content required)' });
    }

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

/* -------------------------------
   UPDATE post (protected)
   ------------------------------- */

app.put('/api/posts/:id', authMiddleware, (req, res) => {
    const id = req.params.id;
    const { title, date, content } = req.body || {};
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });

    if (!title || !date || !content) return res.status(400).json({ error: 'Missing fields' });

    posts[idx] = {
        ...posts[idx],
        title,
        date,
        content,
        updatedAt: Date.now()
    };
    writePosts(posts);
    res.json(posts[idx]);
});

/* -------------------------------
   DELETE post (protected)
   ------------------------------- */

app.delete('/api/posts/:id', authMiddleware, (req, res) => {
    const id = req.params.id;
    let posts = readPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });

    const removed = posts.splice(idx, 1)[0];
    writePosts(posts);
    res.json({ deleted: removed });
});

/* -------------------------------
   EXPORT posts (protected) -> download JSON
   ------------------------------- */

app.get('/api/export', authMiddleware, (req, res) => {
    const posts = readPosts();
    res.setHeader('Content-Disposition', 'attachment; filename="urbanPosts_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(posts, null, 4));
});

/* -------------------------------
   IMPORT posts (protected)
   Accepts JSON array in body
   ------------------------------- */

app.post('/api/import', authMiddleware, (req, res) => {
    const incoming = req.body;
    if (!Array.isArray(incoming)) {
        return res.status(400).json({ error: 'Import body must be an array of posts' });
    }

    // Optional: validate shape of each post
    const sanitized = incoming.map(item => {
        return {
            id: item.id || uuidv4(),
            title: item.title || 'Untitled',
            date: item.date || '',
            content: item.content || '',
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || null
        };
    });

    writePosts(sanitized);
    res.json({ imported: sanitized.length });
});

/* -------------------------------
   Serve static files (optional)
   Place your public site (index.html, admin.html, etc.) in /public
   ------------------------------- */

const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    console.log('Serving static files from /public');
}

/* -------------------------------
   Start
   ------------------------------- */

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

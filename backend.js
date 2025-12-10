// backend.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const POSTS_FILE = path.join(__dirname, 'posts.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

// --- Helpers ---
function readPosts() {
    try {
        if (!fs.existsSync(POSTS_FILE)) return [];
        const data = fs.readFileSync(POSTS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error(err);
        return [];
    }
}

function savePosts(posts) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 4), 'utf8');
}

// --- Multer setup for image uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// --- Auth middleware ---
function checkAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// --- Routes ---

// Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) return res.json({ token: ADMIN_PASSWORD });
    res.status(401).json({ error: 'Invalid password' });
});

// Get all posts
app.get('/api/posts', (req, res) => {
    const posts = readPosts();
    res.json(posts);
});

// Create new post
app.post('/api/posts', checkAuth, upload.array('images'), (req, res) => {
    const { title, date, content } = req.body;
    if (!title || !content || !date) return res.status(400).json({ error: 'Missing fields' });

    const posts = readPosts();

    const images = (req.files || []).map(f => `/uploads/${f.filename}`);
    const newPost = { id: uuidv4(), title, date, content, images };

    posts.push(newPost); // append to existing posts
    savePosts(posts);

    res.json({ success: true, post: newPost });
});

// Update post
app.put('/api/posts/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const { title, date, content } = req.body;

    let posts = readPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });

    posts[idx] = { ...posts[idx], title, date, content };
    savePosts(posts);

    res.json({ success: true });
});

// Delete post
app.delete('/api/posts/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    let posts = readPosts();
    const filtered = posts.filter(p => p.id !== id);
    if (filtered.length === posts.length) return res.status(404).json({ error: 'Post not found' });

    savePosts(filtered);
    res.json({ success: true });
});

// Export all posts
app.get('/api/export', checkAuth, (req, res) => {
    const posts = readPosts();
    res.setHeader('Content-Disposition', 'attachment; filename="posts_export.json"');
    res.json(posts);
});

// Import posts from JSON
app.post('/api/import', checkAuth, (req, res) => {
    const newPosts = req.body;
    if (!Array.isArray(newPosts)) return res.status(400).json({ error: 'Invalid JSON format' });

    const existing = readPosts();
    const combined = existing.concat(newPosts);
    savePosts(combined);

    res.json({ success: true, imported: newPosts.length });
});

// Start server
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

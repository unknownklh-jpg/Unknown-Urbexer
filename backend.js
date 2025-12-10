const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const POSTS_FILE = path.join(__dirname, 'posts.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Setup image uploads ---
const upload = multer({ dest: 'uploads/' });

// --- Helper functions ---
function readPosts() {
    try {
        const data = fs.readFileSync(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function savePosts(posts) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 4));
}

// --- Simple admin auth ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKENS = new Set();

function generateToken() {
    const t = uuidv4();
    TOKENS.add(t);
    return t;
}

function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'No token provided' });
    const token = auth.replace('Bearer ', '');
    if (!TOKENS.has(token)) return res.status(403).json({ error: 'Invalid token' });
    next();
}

// --- Login ---
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        const token = generateToken();
        return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid password' });
});

// --- Get all posts ---
app.get('/api/posts', (req, res) => {
    res.json(readPosts());
});

// --- Create new post ---
app.post('/api/posts', authMiddleware, upload.array('images'), (req, res) => {
    const { title, date, content } = req.body;
    if (!title || !date || !content) return res.status(400).json({ success: false, error: 'Missing fields' });

    const posts = readPosts();

    const images = (req.files || []).map(file => `/uploads/${file.filename}`);

    const newPost = {
        id: uuidv4(),
        title,
        date,
        content,
        images
    };

    posts.push(newPost); // append new post
    savePosts(posts);

    res.json({ success: true, post: newPost });
});

// --- Update post ---
app.put('/api/posts/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { title, date, content } = req.body;

    const posts = readPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Post not found' });

    posts[index].title = title;
    posts[index].date = date;
    posts[index].content = content;

    savePosts(posts);
    res.json({ success: true });
});

// --- Delete post ---
app.delete('/api/posts/:id', authMiddleware, (req, res) => {
    let posts = readPosts();
    const initialLength = posts.length;
    posts = posts.filter(p => p.id !== req.params.id);
    savePosts(posts);

    if (posts.length === initialLength) return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true });
});

// --- Export posts ---
app.get('/api/export', authMiddleware, (req, res) => {
    res.download(POSTS_FILE, 'posts_export.json');
});

// --- Import posts ---
app.post('/api/import', authMiddleware, (req, res) => {
    const imported = req.body;
    if (!Array.isArray(imported)) return res.status(400).json({ success: false, error: 'Invalid format' });
    savePosts(imported);
    res.json({ success: true, imported: imported.length });
});

// --- Start server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

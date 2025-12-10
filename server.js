const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Path to your posts file
const POSTS_FILE = './posts.json';

// Utility: Read posts safely
function readPosts() {
    try {
        const data = fs.readFileSync(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Utility: Write posts safely
function writePosts(posts) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// Get all posts
app.get('/posts', (req, res) => {
    const posts = readPosts();
    res.json(posts);
});

// Add a new post (Admin only - simple password check)
app.post('/posts', (req, res) => {
    const { title, content, date, password } = req.body;
    const ADMIN_PASSWORD = 'YOUR_ADMIN_PASSWORD'; // Change this!

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const posts = readPosts();
    const newPost = { id: Date.now(), title, content, date };
    posts.push(newPost);
    writePosts(posts);

    res.json({ success: true, post: newPost });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const { Octokit } = require('@octokit/rest');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'explore2025';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const POSTS_FILE = path.join(__dirname, 'posts.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '12345';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'unknownklh-jpg';
const GITHUB_REPO = process.env.GITHUB_REPO || 'unknown-urbexer';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const app = express();

app.use(cors({
  origin: [
    "https://unknownklh-jpg.github.io",
    "https://unknownurbexer.blog"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

let octokit = null;
if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
  octokit = new Octokit({ auth: GITHUB_TOKEN });
}

// Utility functions
function readPosts() {
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([]), 'utf8');
  }
  return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8') || "[]");
}

function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

// Optional GitHub commit
async function saveToGitHub(post) {
  if (!octokit) return;

  const slug = slugify(post.title || 'untitled', { lower: true });
  const filePath = `_posts/${Date.now()}-${slug}.md`;
  const content = Buffer.from(`# ${post.title}\n\n${post.date}\n\n${post.content}`).toString('base64');

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      message: `Add blog post: ${post.title}`,
      content,
      branch: GITHUB_BRANCH,
    });
    console.log(`✅ Committed to GitHub: ${filePath}`);
  } catch (err) {
    console.error("GitHub commit error:", err.message);
  }
}

// Routes
app.get('/api/posts', (req, res) => {
  try {
    const posts = readPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

app.post('/api/posts', upload.none(), async (req, res) => {
  try {
    const { title, date, content } = req.body;
    if (!title || !date || !content) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const posts = readPosts();
    const newPost = {
      id: uuidv4(),
      title,
      date,
      content,
      images: [],
      createdAt: Date.now()
    };

    posts.unshift(newPost);
    writePosts(posts);

    await saveToGitHub(newPost); // optional

    res.status(201).json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

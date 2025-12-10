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
const slugify = require('slugify');
const { Octokit } = require('@octokit/rest');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'explore2025';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const POSTS_FILE = path.join(__dirname, 'posts.json');

// GitHub commit config (set these as Render env vars)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_OWNER || '';
const GITHUB_REPO = process.env.GITHUB_REPO || '';
let GITHUB_BRANCH = process.env.GITHUB_BRANCH || ''; // optional - if blank we will fetch default branch

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

// Multer memory storage for files
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB/file

// Octokit (if token present)
let octokit = null;
if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
    octokit = new Octokit({ auth: GITHUB_TOKEN });
}

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
   GitHub helpers (commit files)
   ------------------------------- */
async function ensureBranch() {
    if (!octokit) throw new Error('GitHub not configured (GITHUB_TOKEN/OWNER/REPO missing)');
    if (GITHUB_BRANCH) return GITHUB_BRANCH;
    // fetch default branch
    const repo = await octokit.repos.get({ owner: GITHUB_OWNER, repo: GITHUB_REPO });
    GITHUB_BRANCH = repo.data.default_branch;
    return GITHUB_BRANCH;
}

async function createOrUpdateFileInRepo({ filePath, contentBase64, commitMessage }) {
    await ensureBranch();
    // first try to get the file to see if it exists, to provide 'sha' on update
    try {
        const existing = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            ref: GITHUB_BRANCH
        });
        const sha = existing.data.sha;
        const res = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: commitMessage,
            content: contentBase64,
            sha,
            branch: GITHUB_BRANCH
        });
        return res.data;
    } catch (err) {
        // If not found -> create new
        if (err.status === 404) {
            const res = await octokit.repos.createOrUpdateFileContents({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: filePath,
                message: commitMessage,
                content: contentBase64,
                branch: GITHUB_BRANCH
            });
            return res.data;
        }
        throw err;
    }
}

function rawUrlFor(pathInRepo) {
    // raw.githubusercontent.com/owner/repo/branch/path
    const branch = GITHUB_BRANCH || 'main';
    return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${branch}/${encodeURI(pathInRepo)}`;
}

/* -------------------------------
   POSTS API
   - GET /api/posts (public)
   - POST /api/posts (auth + optional images multipart)
   - PUT /api/posts/:id (auth update)
   - DELETE /api/posts/:id (auth)
   ------------------------------- */

// List posts (from local posts.json)
app.get('/api/posts', (req, res) => {
    const posts = readPosts().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(posts);
});

// Create post - supports multipart/form-data with images[] and fields: title, date, content, tags (optional)
app.post('/api/posts', authMiddleware, upload.array('images', 8), async (req, res) => {
    try {
        const { title, date, content, tags } = req.body;
        if (!title || !date || !content) return res.status(400).json({ error: "Missing fields" });

        // Save image files to GitHub repo (if any)
        const images = [];
        if (req.files && req.files.length > 0) {
            if (!octokit) {
                return res.status(500).json({ error: "GitHub not configured on server; cannot store images" });
            }
            for (const f of req.files) {
                const ext = path.extname(f.originalname) || '';
                const safeName = f.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
                const tstamp = Date.now();
                const unique = uuidv4();
                const repoPath = `assets/uploads/${tstamp}-${unique}-${safeName}`;
                const base64 = f.buffer.toString('base64');

                await createOrUpdateFileInRepo({
                    filePath: repoPath,
                    contentBase64: base64,
                    commitMessage: `Upload image ${safeName}`
                });

                images.push({
                    name: f.originalname,
                    path: repoPath,
                    url: rawUrlFor(repoPath)
                });
            }
        }

        // Build markdown for _posts (Jekyll-style frontmatter)
        const postDate = new Date(date);
        const isoDate = postDate.toISOString();
        const slug = slugify(title, { lower: true, strict: true }) || `post-${Date.now()}`;
        let bodyContent = content || '';

        if (images.length > 0) {
            const imgsMd = images.map(i => `![${i.name}](${i.url})`).join('\n\n');
            bodyContent = `${bodyContent}\n\n${imgsMd}`;
        }

        const frontmatter = [
            '---',
            `title: "${title.replace(/"/g, '\\"')}"`,
            `date: "${isoDate}"`,
            tags ? `tags: [${tags.split(',').map(t => `"${t.trim()}"`).join(', ')}]` : '',
            '---',
            '',
        ].filter(Boolean).join('\n');

        const markdown = `${frontmatter}${bodyContent}\n`;

        // Commit markdown to repo under _posts
        if (!octokit) {
            return res.status(500).json({ error: "GitHub not configured on server; cannot create post file" });
        }
        const datePrefix = postDate.toISOString().slice(0, 10); // YYYY-MM-DD
        const postFilename = `_posts/${datePrefix}-${slug}.md`;
        const mdBase64 = Buffer.from(markdown, 'utf8').toString('base64');

        await createOrUpdateFileInRepo({
            filePath: postFilename,
            contentBase64: mdBase64,
            commitMessage: `Add post: ${title}`
        });

        // Also add to local posts.json (so admin list updates quickly)
        const posts = readPosts();
        const newPost = {
            id: uuidv4(),
            title,
            date,
            content: bodyContent,
            images: images.map(i => i.url),
            githubPath: postFilename,
            createdAt: Date.now()
        };
        posts.unshift(newPost);
        writePosts(posts);

        return res.status(201).json({ success: true, post: newPost, images });
    } catch (err) {
        console.error("Error creating post:", err);
        return res.status(500).json({ error: err.message || String(err) });
    }
});

// Update post (local posts.json) - note: this does not rewrite the GitHub _posts markdown file
// If you want edits to update GitHub pages article too, we can extend this later.
app.put('/api/posts/:id', authMiddleware, (req, res) => {
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Post not found" });

    const { title, date, content } = req.body;
    if (!title || !date || !content) return res.status(400).json({ error: "Missing fields" });

    posts[idx] = { ...posts[idx], title, date, content, updatedAt: Date.now() };
    writePosts(posts);
    res.json({ success: true, post: posts[idx] });
});

app.delete('/api/posts/:id', authMiddleware, (req, res) => {
    let posts = readPosts();
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Post not found" });

    const removed = posts.splice(idx, 1)[0];
    writePosts(posts);
    res.json({ success: true, deleted: removed });
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

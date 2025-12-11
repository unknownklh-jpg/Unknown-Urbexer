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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = process.env.GITHUB_OWNER || '';
const GITHUB_REPO = process.env.GITHUB_REPO || '';
let GITHUB_BRANCH = process.env.GITHUB_BRANCH || '';

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

function readPosts() {
  if (!fs.existsSync(POSTS_FI_

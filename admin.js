// admin.js
const API_BASE = 'https://unknown-urbexer.onrender.com'; // Replace with your Render backend URL
const ADMIN_PASSWORD = 'explore2025'; // Replace with your admin password

// DOM Elements
const loginBox = document.getElementById('login-box');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const adminArea = document.getElementById('admin-area');

const postTitle = document.getElementById('post-title');
const postDate = document.getElementById('post-date');
const postContent = document.getElementById('post-content');
const savePostBtn = document.getElementById('save-post');
const postList = document.getElementById('post-list');

const exportBtn = document.getElementById('export-posts');
const importInput = document.getElementById('import-file');
const importBtn = document.getElementById('import-posts');
const importStatus = document.getElementById('import-status');

let posts = [];
let editingIndex = null; // Track which post is being edited

// --- Admin Login ---
loginBtn.addEventListener('click', () => {
    const pw = document.getElementById('admin-password').value;
    if (pw === ADMIN_PASSWORD) {
        loginBox.style.display = 'none';
        adminArea.style.display = 'block';
        loadPosts();
    } else {
        loginError.textContent = 'Incorrect password.';
    }
});

// --- Load posts from backend ---
async function loadPosts() {
    try {
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) throw new Error('Failed to fetch posts from backend');
        posts = await res.json();
        renderPostList();
    } catch (err) {
        console.error(err);
        posts = [];
        renderPostList();
    }
}

// --- Render posts in admin ---
function renderPostList() {
    postList.innerHTML = '';
    posts.forEach((post, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${post.title} (${post.date})</span>
            <div class="post-buttons">
                <button onclick="editPost(${index})">Edit</button>
                <button onclick="deletePost(${index})">Delete</button>
            </div>
        `;
        postList.appendChild(li);
    });
}

// --- Save Post (Add or Edit) ---
savePostBtn.addEventListener('click', async () => {
    const title = postTitle.value.trim();
    const date = postDate.value;
    const content = postContent.value.trim();
    if (!title || !content || !date) return alert('Fill all fields.');

    try {
        let res;
        if (editingIndex !== null) {
            // Update existing post
            posts[editingIndex] = { title, date, content };
            res = await fetch(`${API_BASE}/api/posts/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ posts })
            });
            editingIndex = null;
        } else {
            // Add new post
            res = await fetch(`${API_BASE}/api/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date, content })
            });
        }

        const data = await res.json();
        if (data.success) {
            posts = data.posts;
            renderPostList();
            postTitle.value = '';
            postDate.value = '';
            postContent.value = '';
            alert('Post saved!');
        } else {
            alert('Failed to save post.');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving post.');
    }
});

// --- Edit Post ---
window.editPost = (index) => {
    const post = posts[index];
    postTitle.value = post.title;
    postDate.value = post.date;
    postContent.value = post.content;
    editingIndex = index;
};

// --- Delete Post ---
window.deletePost = async (index) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    posts.splice(index, 1); // remove locally

    try {
        const res = await fetch(`${API_BASE}/api/posts/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ posts })
        });
        const data = await res.json();
        if (data.success) {
            renderPostList();
        } else {
            alert('Failed to delete post.');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting post.');
    }
};

// --- Export posts to JSON ---
exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.json';
    a.click();
    URL.revokeObjectURL(url);
});

// --- Import posts from JSON ---
importBtn.addEventListener('click', () => {
    const file = importInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const importedPosts = JSON.parse(reader.result);
            if (!Array.isArray(importedPosts)) throw new Error('Invalid JSON');
            posts = importedPosts;
            renderPostList();
            importStatus.textContent = 'Posts imported successfully!';
        } catch (err) {
            console.error(err);
            importStatus.textContent = 'Failed to import posts.';
        }
    };
    reader.readAsText(file);
});

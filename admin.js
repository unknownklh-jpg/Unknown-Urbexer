// admin.js - talks to backend APIs
const API_BASE = 'https://unknown-urbexer.onrender.com';
const loginBox = document.getElementById("login-box");
const adminArea = document.getElementById("admin-area");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const saveBtn = document.getElementById("save-post");

// check existing token
function getToken() {
    return localStorage.getItem('adminToken') || null;
}

function authFetch(url, opts = {}) {
    const token = getToken();
    opts.headers = opts.headers || {};
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    return fetch(API_BASE + url, opts);
}

/* -------------------------------
   LOGIN
   ------------------------------- */

loginBtn.addEventListener("click", async () => {
    const pass = document.getElementById("admin-password").value;
    try {
        const res = await fetch(API_BASE + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass })
        });
        const data = await res.json();
        if (!res.ok) {
            loginError.textContent = data.error || 'Login failed';
            return;
        }
        localStorage.setItem('adminToken', data.token);
        loginBox.style.display = "none";
        adminArea.style.display = "block";
        loadPosts();
    } catch (err) {
        loginError.textContent = 'Network error';
        console.error(err);
    }
});

/* -------------------------------
   LOAD POSTS TO ADMIN LIST
   ------------------------------- */

async function loadPosts() {
    const list = document.getElementById("post-list");
    list.innerHTML = "Loading...";

    try {
        const res = await fetch(API_BASE + '/api/posts');
        const posts = await res.json();
        list.innerHTML = "";

        if (!Array.isArray(posts) || posts.length === 0) {
            list.innerHTML = '<li>No posts yet.</li>';
            return;
        }

        posts.forEach((post, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${index + 1}. ${escapeHtml(post.title)}</span>
                <span class="post-buttons">
                    <button class="edit-btn" data-id="${post.id}">Edit</button>
                    <button class="delete-btn" data-id="${post.id}">Delete</button>
                </span>
            `;
            list.appendChild(li);
        });

        // events
        document.querySelectorAll(".delete-btn").forEach(btn =>
            btn.addEventListener("click", deletePost)
        );

        document.querySelectorAll(".edit-btn").forEach(btn =>
            btn.addEventListener("click", editPost)
        );

    } catch (err) {
        console.error(err);
        list.innerHTML = '<li>Error loading posts.</li>';
    }
}

/* -------------------------------
   CREATE / UPDATE logic
   ------------------------------- */

function clearForm() {
    document.getElementById("post-title").value = "";
    document.getElementById("post-date").value = "";
    document.getElementById("post-content").value = "";
}

document.getElementById("save-post").addEventListener("click", async () => {
    const title = document.getElementById("post-title").value.trim();
    const date = document.getElementById("post-date").value.trim();
    const content = document.getElementById("post-content").value.trim();

    if (!title || !date || !content) {
        alert("All fields are required!");
        return;
    }

    const editId = saveBtn.dataset.editId;
    try {
        if (editId) {
            // update
            const res = await authFetch('/api/posts/' + editId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date, content })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
            alert('Post updated');
            delete saveBtn.dataset.editId;
            saveBtn.textContent = 'Save Post';
        } else {
            // create
            const res = await authFetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date, content })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Create failed');
            alert('Post created');
        }
        clearForm();
        loadPosts();
    } catch (err) {
        alert('Error: ' + err.message);
        console.error(err);
    }
});

/* -------------------------------
   DELETE
   ------------------------------- */

async function deletePost(e) {
    const id = e.target.dataset.id;
    if (!confirm('Delete this post?')) return;

    try {
        const res = await authFetch('/api/posts/' + id, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
        alert('Deleted');
        loadPosts();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

/* -------------------------------
   EDIT
   ------------------------------- */

async function editPost(e) {
    const id = e.target.dataset.id;
    try {
        const res = await fetch(API_BASE + '/api/posts');
        const posts = await res.json();
        const post = posts.find(p => p.id === id);
        if (!post) { alert('Post not found'); return; }

        document.getElementById("post-title").value = post.title;
        document.getElementById("post-date").value = post.date;
        document.getElementById("post-content").value = post.content;

        saveBtn.textContent = 'Update Post';
        saveBtn.dataset.editId = id;
    } catch (err) {
        console.error(err);
        alert('Error fetching post');
    }
}

/* -------------------------------
   EXPORT (download)
   ------------------------------- */

document.getElementById("export-posts").addEventListener("click", async () => {
    try {
        const res = await authFetch('/api/export');
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'urbanPosts_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Error exporting: ' + err.message);
    }
});

/* -------------------------------
   IMPORT (upload file and send to backend)
   ------------------------------- */

document.getElementById("import-posts").addEventListener("click", async () => {
    const fileInput = document.getElementById("import-file");
    const status = document.getElementById("import-status");

    if (!fileInput.files[0]) {
        status.textContent = "❗ No file selected.";
        status.style.color = "#ff1a1a";
        return;
    }

    const file = fileInput.files[0];
    try {
        const text = await file.text();
        const json = JSON.parse(text);

        const res = await authFetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json)
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Import failed');

        status.textContent = `✔️ Imported ${body.imported} posts.`;
        status.style.color = '#00cc88';
        loadPosts();
    } catch (err) {
        status.textContent = '❗ Import failed: ' + err.message;
        status.style.color = '#ff1a1a';
    }
});

/* -------------------------------
   UTILS
   ------------------------------- */

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, s => {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return map[s] || s;
    });
}

// On page load: if token present, skip login box
document.addEventListener('DOMContentLoaded', () => {
    if (getToken()) {
        loginBox.style.display = 'none';
        adminArea.style.display = 'block';
        loadPosts();
    }
});



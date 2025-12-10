// admin.js (updated) - full replacement
const API_BASE = 'https://unknown-urbexer.onrender.com'; // Replace with your Render backend URL

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

const imagesInput = document.getElementById('post-images');
const imagePreview = document.getElementById('image-preview');

const logoutBtn = document.getElementById('logout-btn');

let posts = [];
let editingId = null; // id of post being edited
let token = localStorage.getItem('admin_token') || null;

// --- Auth helpers ---
function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function checkAuthAndShow() {
    if (!token) return showLogin();
    // try fetching posts to verify token
    try {
        const res = await fetch(`${API_BASE}/api/posts`, { headers: authHeaders() });
        if (res.ok) {
            loginBox.style.display = 'none';
            adminArea.style.display = 'block';
            loadPosts();
        } else {
            showLogin();
        }
    } catch (err) {
        showLogin();
    }
}

function showLogin() {
    loginBox.style.display = 'block';
    adminArea.style.display = 'none';
}

// --- Login ---
loginBtn.addEventListener('click', async () => {
    const pw = document.getElementById('admin-password').value;
    if (!pw) return loginError.textContent = 'Enter password';
    loginError.textContent = '';
    try {
        const res = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pw })
        });
        const data = await res.json();
        if (!res.ok) {
            loginError.textContent = data.error || 'Login failed';
            return;
        }
        token = data.token;
        localStorage.setItem('admin_token', token);
        loginBox.style.display = 'none';
        adminArea.style.display = 'block';
        loadPosts();
    } catch (err) {
        loginError.textContent = 'Login error';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('admin_token');
    showLogin();
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
    posts.forEach((post) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span style="max-width:70%"><strong>${escapeHtml(post.title)}</strong> <br/><small>${post.date}</small></span>
            <div class="post-buttons">
                <button data-id="${post.id}" class="edit-btn">Edit</button>
                <button data-id="${post.id}" class="delete-btn">Delete</button>
            </div>
        `;
        postList.appendChild(li);
    });

    // attach listeners
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        editPost(id);
    }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deletePost(id);
    }));
}

// --- Save Post (Add or Edit) ---
savePostBtn.addEventListener('click', async () => {
    const title = postTitle.value.trim();
    const date = postDate.value;
    const content = postContent.value.trim();
    if (!title || !content || !date) return alert('Fill all fields.');

    try {
        if (!token) return alert('Not authenticated. Please login.');

        if (editingId) {
            // Update existing post via PUT (local posts.json)
            const res = await fetch(`${API_BASE}/api/posts/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ title, date, content })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await loadPosts();
                resetForm();
                alert('Post updated!');
            } else {
                alert('Failed to update post: ' + (data.error || JSON.stringify(data)));
            }
        } else {
            // Create new post with optional images - use multipart/form-data
            const form = new FormData();
            form.append('title', title);
            form.append('date', date);
            form.append('content', content);

            const files = imagesInput.files;
            for (let i = 0; i < files.length; i++) {
                form.append('images', files[i], files[i].name);
            }

            const res = await fetch(`${API_BASE}/api/posts`, {
                method: 'POST',
                headers: authHeaders(),
                body: form
            });
            const data = await res.json();
            if (res.ok && data.success) {
                posts.unshift(data.post);
                renderPostList();
                resetForm();
                alert('Post created and published!');
            } else {
                alert('Failed to create post: ' + (data.error || JSON.stringify(data)));
            }
        }
    } catch (err) {
        console.error(err);
        alert('Error saving post.');
    }
});

function resetForm() {
    postTitle.value = '';
    postDate.value = '';
    postContent.value = '';
    imagesInput.value = '';
    imagePreview.innerHTML = '';
    editingId = null;
}

// --- Edit Post ---
function editPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return alert('Post not found');
    postTitle.value = post.title;
    postDate.value = post.date ? post.date.slice(0,10) : '';
    postContent.value = post.content || '';
    editingId = id;
}

// --- Delete Post ---
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/posts/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();
        if (res.ok && data.success) {
            posts = posts.filter(p => p.id !== id);
            renderPostList();
        } else {
            alert('Failed to delete post.');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting post.');
    }
}

// --- Export posts to JSON (from server) ---
exportBtn.addEventListener('click', async () => {
    if (!token) return alert('Please login first');
    try {
        const res = await fetch(`${API_BASE}/api/export`, { headers: authHeaders() });
        if (!res.ok) return alert('Export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'posts_export.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        alert('Export failed');
    }
});

// --- Import from JSON (uploads to local posts.json on server) ---
importBtn.addEventListener('click', async () => {
    const file = importInput.files[0];
    if (!file) return alert('Select a JSON file first');
    if (!token) return alert('Please login first');
    try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) return alert('Invalid JSON format (expected array)');
        const res = await fetch(`${API_BASE}/api/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(parsed)
        });
        const data = await res.json();
        if (res.ok) {
            importStatus.textContent = `Imported ${data.imported} posts`;
            await loadPosts();
        } else {
            importStatus.textContent = 'Import failed: ' + (data.error || JSON.stringify(data));
        }
    } catch (err) {
        console.error(err);
        importStatus.textContent = 'Import failed';
    }
});

// --- Image preview ---
imagesInput.addEventListener('change', () => {
    imagePreview.innerHTML = '';
    const files = imagesInput.files;
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(f);
    }
});

// small helper to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' ,"'":'&#39;'})[m]);
}

// initialize
checkAuthAndShow();

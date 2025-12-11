const API_BASE = 'https://unknown-urbexer.onrender.com';

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
let editingId = null;
let token = localStorage.getItem('admin_token') || null;

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function checkAuthAndShow() {
  if (!token) return showLogin();
  try {
    const res = await fetch(`${API_BASE}/api/posts`, { headers: authHeaders() });
    if (res.ok) {
      loginBox.style.display = 'none';
      adminArea.style.display = 'block';
      loadPosts();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  loginBox.style.display = 'block';
  adminArea.style.display = 'none';
}

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
  } catch {
    loginError.textContent = 'Login error';
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('admin_token');
  showLogin();
});

async function loadPosts() {
  try {
    const res = await fetch(`${API_BASE}/api/posts`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    posts = await res.json();
    renderPostList();
  } catch {
    posts = [];
    renderPostList();
  }
}

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

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => editPost(e.currentTarget.getAttribute('data-id')));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => deletePost(e.currentTarget.getAttribute('data-id')));
  });
}

savePostBtn.addEventListener('click', async () => {
  const title = postTitle.value.trim();
  const date = postDate.value;
  const content = postContent.value.trim();
  if (!title || !content || !date) return alert('Fill all fields.');

  try {
    if (!token) return alert('Not authenticated. Please login.');

    if (editingId) {
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

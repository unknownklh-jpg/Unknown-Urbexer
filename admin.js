const API_BASE = "https://unknown-urbexer.onrender.com";
let token = localStorage.getItem("admin_token");

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showLogin() {
  document.getElementById("login-box").style.display = "block";
  document.getElementById("admin-area").style.display = "none";
}

function showAdmin() {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("admin-area").style.display = "block";
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const pw = document.getElementById("admin-password").value;
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ password: pw })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    localStorage.setItem("admin_token", token);
    showAdmin();
    loadPosts();
  } else {
    document.getElementById("login-error").textContent = data.error;
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("admin_token");
  token = null;
  showLogin();
});

// load posts in admin
async function loadPosts() {
  const res = await fetch(`${API_BASE}/api/posts`);
  const posts = await res.json();
  const ul = document.getElementById("post-list");
  ul.innerHTML = "";
  posts.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.title} (${p.date})`;
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = async () => {
      await fetch(`${API_BASE}/api/posts/${p.id}`, { method: "DELETE", headers: authHeaders() });
      loadPosts();
    };
    li.appendChild(del);
    ul.appendChild(li);
  });
}

document.getElementById("save-post").addEventListener("click", async () => {
  const title = document.getElementById("post-title").value;
  const date = document.getElementById("post-date").value;
  const content = document.getElementById("post-content").value;
  if (!title || !date || !content) return;

  await fetch(`${API_BASE}/api/posts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, date, content })
  });
  loadPosts();
});

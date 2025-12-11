const API_BASE = 'https://unknown-urbexer.onrender.com';
const FALLBACK_JSON = '/package.json';

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("public-posts");
  if (!container) return;

  container.innerHTML = 'Loading posts...';

  let posts = [];

  try {
    const res = await fetch(`${API_BASE}/api/posts`);
    if (!res.ok) throw new Error(`Backend fetch failed: ${res.status}`);
    posts = await res.json();
  } catch (err) {
    console.warn('Backend failed, using fallback JSON:', err);

    try {
      const resFallback = await fetch(FALLBACK_JSON);
      if (!resFallback.ok) throw new Error(`Fallback fetch failed: ${resFallback.status}`);
      posts = await resFallback.json();
    } catch (fallbackErr) {
      console.error('Error loading fallback posts:', fallbackErr);
      container.innerHTML = '<p>Error loading posts. Please try again later.</p>';
      return;
    }
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  container.innerHTML = "";
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  posts.forEach(post => {
    if (!post.id) return;

    const div = document.createElement("div");
    div.className = "post";

    let imagesHTML = "";
    if (post.images && post.images.length > 0) {
      imagesHTML = post.images
        .map(url => `<img src="${url}" alt="Post image" class="post-thumb">`)
        .join("");
    }

    const preview = (post.content || "").slice(0, 250).replace(/\n/g, "<br>")
      + (post.content.length > 250 ? "..." : "");

    div.innerHTML = `
      ${imagesHTML}
      <h2>${escapeHtml(post.title)}</h2>
      <p class="date">${escapeHtml(post.date)}</p>
      <p>${preview}</p>
      <a href="post.html?id=${post.id}" class="read-more">Read More →</a>
      <hr>
    `;

    container.appendChild(div);
  });
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[s] || s;
  });
}

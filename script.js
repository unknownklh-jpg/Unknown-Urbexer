const API_BASE = "https://unknown-urbexer.onrender.com";

async function loadPosts() {
  const container = document.getElementById("public-posts");
  container.innerHTML = "Loading posts...";

  try {
    const res = await fetch(`${API_BASE}/api/posts`);
    if (!res.ok) throw new Error("Failed to load");
    const posts = await res.json();
    if (!posts.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    container.innerHTML = "";
    posts.sort((a,b) => new Date(b.date) - new Date(a.date));
    posts.forEach(p => {
      container.innerHTML += `
        <div class="post">
          <h2>${escapeHtml(p.title)}</h2>
          <p class="date">${escapeHtml(p.date)}</p>
          <p>${escapeHtml(p.content).slice(0,200)}...</p>
          <a href="post.html?id=${p.id}" class="read-more">Read More →</a>
        </div>
      `;
    });
  } catch {
    container.innerHTML = "<p>Failed to load posts.</p>";
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[s]);
}

document.addEventListener("DOMContentLoaded", loadPosts);

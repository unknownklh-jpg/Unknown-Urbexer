document.addEventListener("DOMContentLoaded", loadPosts);

async function loadPosts() {
  const container = document.getElementById("public-posts");
  container.innerHTML = "Loading...";

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    container.innerHTML = "<p>Error loading posts</p>";
    return;
  }

  if (!posts.length) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  container.innerHTML = "";
  posts.forEach(p => {
    container.innerHTML += `
      <div class="post">
        <h2>${escapeHtml(p.title)}</h2>
        <p class="date">${escapeHtml(p.date)}</p>
        <p>${escapeHtml(p.content).slice(0,200).replace(/\n/g,"<br>")}...</p>
        <a href="post.html?id=${p.id}" class="read-more">Read More →</a>
      </div>
    `;
  });
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}

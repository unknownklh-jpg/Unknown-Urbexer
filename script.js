<script type="module">
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 1️⃣ Initialize Supabase
const supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co';
const supabaseKey = 'YOUR_PUBLIC_ANON_KEY'; // usually anon public key
const supabase = createClient(supabaseUrl, supabaseKey);

// 2️⃣ Wait for DOM
document.addEventListener("DOMContentLoaded", loadPosts);

async function loadPosts() {
  const container = document.getElementById("public-posts");
  container.innerHTML = "<p>Loading posts...</p>";

  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, title, content, date")
      .order("date", { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    // Build HTML efficiently
    container.innerHTML = posts.map(p => `
      <div class="post">
        <h2>${escapeHtml(p.title)}</h2>
        <p class="date">${escapeHtml(p.date)}</p>
        <p>${escapeHtml(p.content).slice(0, 200).replace(/\n/g, "<br>")}...</p>
        <a href="post.html?id=${p.id}" class="read-more">Read More →</a>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error fetching posts:", err);
    container.innerHTML = `<p>Error loading posts: ${escapeHtml(err.message || err)}</p>`;
  }
}

// Escape HTML safely
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}
</script>

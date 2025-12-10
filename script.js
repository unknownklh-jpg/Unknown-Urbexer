// script.js - public site loads posts from Render backend
const API_BASE = 'https://unknown-urbexer.onrender.com'; // <-- replace with your Render backend URL

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("public-posts");
    if (!container) return;

    container.innerHTML = 'Loading posts...';

    try {
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
        const posts = await res.json();

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML = "<p>No posts yet.</p>";
            return;
        }

        container.innerHTML = "";
        posts.forEach(post => {
            const div = document.createElement("div");
            div.className = "post";
            div.innerHTML = `
                <h2>${escapeHtml(post.title)}</h2>
                <p class="date">${escapeHtml(post.date)}</p>
                <p>${escapeHtml(post.content).replace(/\n/g, '<br>')}</p>
                <hr>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error('Error loading posts:', err);
        container.innerHTML = '<p>Error loading posts. Please try again later.</p>';
    }
});

// Utility to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return map[s] || s;
    });
}



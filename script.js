// script.js - public site loads posts from Render backend with fallback to static JSON
const API_BASE = 'https://unknown-urbexer.onrender.com'; // <-- Replace with your Render backend URL
const FALLBACK_JSON = '/package.json'; // Static JSON file in your repo

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("public-posts");
    if (!container) return;

    container.innerHTML = 'Loading posts...';

    let posts = [];

    // Try fetching from backend first
    try {
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) throw new Error(`Backend fetch failed: ${res.status}`);
        posts = await res.json();
    } catch (err) {
        console.warn('Render backend failed, falling back to static JSON:', err);

        // Fallback to local JSON
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

    // Display posts
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
});

// Utility to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return map[s] || s;
    });
}

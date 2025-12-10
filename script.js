document.addEventListener("DOMContentLoaded", () => {
    const postContainer = document.getElementById("posts");

    // load posts
    let posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];

    // seed first post if none exist
    if (posts.length === 0) {
        posts = [
            {
                title: "Rolling Thunder, Conway, Arkansas.",
                date: "Dec 7 2025",
                content: `
                   
                `
            }
        ];
        localStorage.setItem("urbanPosts", JSON.stringify(posts));
    }

    posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        div.innerHTML = `
            <h2>${post.title}</h2>
            <p class="post-date">${post.date}</p>
            <p>${post.content}</p>
        `;

        postContainer.appendChild(div);
    });
});

// Load posts onto the public site
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("public-posts");

    if (!container) return;

    const posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];

    if (posts.length === 0) {
        container.innerHTML = "<p>No posts yet.</p>";
        return;
    }

    container.innerHTML = "";

    posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        div.innerHTML = `
            <h2>${post.title}</h2>
            <p class="date">${post.date}</p>
            <p>${post.content.replace(/\n/g, "<br>")}</p>
            <hr>
        `;

        container.appendChild(div);
    });
});


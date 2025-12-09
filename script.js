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

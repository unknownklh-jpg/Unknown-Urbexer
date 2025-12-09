document.addEventListener("DOMContentLoaded", () => {
    const posts = [
        {
            title: "Rolling Thunder, Conway, Arkansas.",
            date: "Dec 7 2025",
            content: `
                Rolling Thunder was an old, forgotten entertainment center on the edge of Conway.
                Once full of lights, games, and noise—now it sits dark and hollow, an echo chamber 
                of everything it used to be. I entered through a torn emergency exit door, flashlight 
                cutting through the dust. The air was thick, and the silence felt staged.
                <br><br>
                Graffiti sprawled across the walls, arcade machines toppled over like casualties.
                For a moment, I swear I heard rollers gliding across the rink—but the place has 
                been abandoned for years.
                <br><br>
                I’ll drop the full gallery soon.
            `
        }
    ];

    const postContainer = document.getElementById("posts");

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

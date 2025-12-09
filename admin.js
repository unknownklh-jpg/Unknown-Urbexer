const PASSWORD = "explore2025"; // Change this to your preferred password

const loginBox = document.getElementById("login-box");
const adminArea = document.getElementById("admin-area");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

loginBtn.addEventListener("click", () => {
    const pass = document.getElementById("admin-password").value;
    if (pass === PASSWORD) {
        loginBox.style.display = "none";
        adminArea.style.display = "block";
        loadPosts();
    } else {
        loginError.textContent = "Incorrect password!";
    }
});

// Load posts into admin list
function loadPosts() {
    const list = document.getElementById("post-list");
    list.innerHTML = "";

    const posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];

    posts.forEach((post, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${post.title}`;
        list.appendChild(li);
    });
}

// Save new post
document.getElementById("save-post").addEventListener("click", () => {
    const title = document.getElementById("post-title").value;
    const date = document.getElementById("post-date").value;
    const content = document.getElementById("post-content").value;

    if (!title || !date || !content) {
        alert("All fields are required!");
        return;
    }

    const posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];
    posts.unshift({ title, date, content });

    localStorage.setItem("urbanPosts", JSON.stringify(posts));

    alert("Post added!");

    document.getElementById("post-title").value = "";
    document.getElementById("post-date").value = "";
    document.getElementById("post-content").value = "";

    loadPosts();
});

/* ------------------------------- */
/*         JSON EXPORT              */
/* ------------------------------- */

document.getElementById("export-posts").addEventListener("click", () => {
    const posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posts, null, 4));
    const dlAnchor = document.createElement("a");

    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "urbanPosts_backup.json");
    dlAnchor.click();
});

/* ------------------------------- */
/*         JSON IMPORT              */
/* ------------------------------- */

document.getElementById("import-posts").addEventListener("click", () => {
    const fileInput = document.getElementById("import-file");
    const status = document.getElementById("import-status");

    if (!fileInput.files[0]) {
        status.textContent = "❗ No file selected.";
        status.style.color = "#ff1a1a";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const importedPosts = JSON.parse(e.target.result);

            if (!Array.isArray(importedPosts)) {
                throw new Error("Invalid JSON format — must be an array.");
            }

            localStorage.setItem("urbanPosts", JSON.stringify(importedPosts));

            status.textContent = "✔️ Import successful! Refresh to see changes.";
            status.style.color = "#00ff88";

            loadPosts();
        } catch (err) {
            status.textContent = "❗ Import failed: " + err.message;
            status.style.color = "#ff1a1a";
        }
    };

    reader.readAsText(fileInput.files[0]);
});

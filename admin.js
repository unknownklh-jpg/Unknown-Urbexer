const PASSWORD = "explore2025"; // Change this if needed

const loginBox = document.getElementById("login-box");
const adminArea = document.getElementById("admin-area");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

/* ------------------------------- */
/*            LOGIN SYSTEM         */
/* ------------------------------- */

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

/* ------------------------------- */
/*      LOAD POSTS + BUTTONS       */
/* ------------------------------- */

function loadPosts() {
    const list = document.getElementById("post-list");
    list.innerHTML = "";

    const posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];

    posts.forEach((post, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span>${index + 1}. ${post.title}</span>
            <span class="post-buttons">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </span>
        `;

        list.appendChild(li);
    });

    // Attach events
    document.querySelectorAll(".delete-btn").forEach(btn =>
        btn.addEventListener("click", deletePost)
    );

    document.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", editPost)
    );
}

/* ------------------------------- */
/*            DELETE POST          */
/* ------------------------------- */

function deletePost(e) {
    const index = e.target.dataset.index;
    let posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];

    if (!confirm(`Delete post: "${posts[index].title}"?`)) return;

    posts.splice(index, 1);
    localStorage.setItem("urbanPosts", JSON.stringify(posts));
    loadPosts();
}

/* ------------------------------- */
/*            EDIT POST            */
/* ------------------------------- */

function editPost(e) {
    const index = e.target.dataset.index;
    let posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];
    const post = posts[index];

    // Fill form fields
    document.getElementById("post-title").value = post.title;
    document.getElementById("post-date").value = post.date;
    document.getElementById("post-content").value = post.content;

    const saveBtn = document.getElementById("save-post");
    saveBtn.textContent = "Update Post";
    saveBtn.dataset.editIndex = index;
}

/* ------------------------------- */
/*     SAVE / UPDATE POST LOGIC    */
/* ------------------------------- */

document.getElementById("save-post").addEventListener("click", () => {
    const title = document.getElementById("post-title").value;
    const date = document.getElementById("post-date").value;
    const content = document.getElementById("post-content").value;

    if (!title || !date || !content) {
        alert("All fields are required!");
        return;
    }

    let posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];
    const saveBtn = document.getElementById("save-post");
    const editIndex = saveBtn.dataset.editIndex;

    if (editIndex !== undefined) {
        // Update existing
        posts[editIndex] = { title, date, content };
        alert("Post updated!");

        // Reset button state
        saveBtn.textContent = "Save Post";
        delete saveBtn.dataset.editIndex;
    } else {
        // Add new
        posts.unshift({ title, date, content });
        alert("Post added!");
    }

    localStorage.setItem("urbanPosts", JSON.stringify(posts));

    // Clear the form
    document.getElementById("post-title").value = "";
    document.getElementById("post-date").value = "";
    document.getElementById("post-content").value = "";

    loadPosts();
});

/* ------------------------------- */
/*          EXPORT POSTS           */
/* ------------------------------- */

document.getElementById("export-posts").addEventListener("click", () => {
    const posts = JSON.parse(localStorage.getItem("urbanPosts")) || [];

    const dataStr = "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(posts, null, 4));

    const dlAnchor = document.createElement("a");

    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "urbanPosts_backup.json");
    dlAnchor.click();
});

/* ------------------------------- */
/*          IMPORT POSTS           */
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


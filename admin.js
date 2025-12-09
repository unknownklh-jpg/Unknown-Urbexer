const PASSWORD = "explore2025"; // Change this for security ✔️

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

// LOAD POSTS INTO LIST
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

// SAVE NEW POST
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

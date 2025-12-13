document.addEventListener("DOMContentLoaded", () => {
  // ✅ Ensure Supabase client is initialized
  const supabase = window.supabase;

  if (!supabase || typeof supabase.from !== "function") {
    console.error("❌ Supabase client not initialized or invalid");
    return;
  }

  // 🔐 Show login screen
  function showLogin() {
    document.getElementById("login-box").style.display = "block";
    document.getElementById("admin-area").style.display = "none";
  }

  // 🔓 Show admin panel
  function showAdmin() {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-area").style.display = "block";
    loadPosts();
  }

  // 🔑 Login handler
  document.getElementById("login-btn").addEventListener("click", () => {
    const pw = document.getElementById("admin-password").value;
    if (pw === "Gummybear35!!") {
      showAdmin();
    } else {
      document.getElementById("login-error").textContent = "Invalid password";
    }
  });

  // 🔐 Logout handler
  document.getElementById("logout-btn").addEventListener("click", () => {
    showLogin();
  });

  // 📥 Load all posts
  async function loadPosts() {
    const list = document.getElementById("post-list");
    list.innerHTML = "<li>Loading...</li>";

    try {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("❌ Load error:", error);
        list.innerHTML = "<li>Error loading posts</li>";
        return;
      }

      list.innerHTML = "";
      posts.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.title} — ${p.date}`;

        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = async () => {
          await supabase.from("posts").delete().eq("id", p.id);
          loadPosts();
        };

        li.appendChild(del);
        list.appendChild(li);
      });
    } catch (err) {
      console.error("Unexpected error while loading posts:", err);
      list.innerHTML = "<li>Unexpected error loading posts.</li>";
    }
  }

  // 💾 Save a new post
  document.getElementById("save-post").addEventListener("click", async () => {
    const title = document.getElementById("post-title").value;
    const date = document.getElementById("post-date").value;
    const content = document.getElementById("post-content").value;

    if (!title || !date || !content) {
      alert("Please fill out all fields");
      return;
    }

    const { error } = await supabase.from("posts").insert([{ title, date, content }]);
    if (error) {
      console.error("Save failed:", error);
      alert("Failed to save post.");
    } else {
      loadPosts();
    }
  });

  // 📂 Import posts from a JSON file
  document.getElementById("import-posts").addEventListener("click", async () => {
    const fileInput = document.getElementById("import-file");
    const status = document.getElementById("import-status");

    if (!fileInput.files.length) {
      status.textContent = "Please select a JSON file first.";
      return;
    }

    const file = fileInput.files[0];
    try {
      const text = await file.text();
      const posts = JSON.parse(text);

      if (!Array.isArray(posts)) throw new Error("JSON must be an array");

        const validPosts = posts.filter(p => p.title && p.date && p.content);

      if (!validPosts.length) {
        status.textContent = "No valid posts found.";
        return;
      }

      const { error } = await supabase.from("posts").insert(validPosts);
      if (error) {
        console.error("Import error:", error);
        status.textContent = "Import failed: " + error.message;
      } else {
        status.textContent = "Import successful! ✅";
        loadPosts();
      }

    } catch (err) {
      console.error("Parse error:", err);
      status.textContent = "Error reading file: " + err.message;
    }
  });

  // 👁️ Show login form by default
  showLogin();
});


// ✅ Supabase client must be defined FIRST
const supabase = window.supabase || createClient(
  'https://nshevzhuytsftonlgfum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaGV2emh1eXRzZnRvbmxnZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzMxMjgsImV4cCI6MjA4MTEwOTEyOH0.ttZ6VNDJFCL1wmZ7zQknu3g4YP2r2nvnUdr2H4yQ7ok'
);

document.addEventListener("DOMContentLoaded", () => {
  function showLogin() {
    document.getElementById("login-box").style.display = "block";
    document.getElementById("admin-area").style.display = "none";
  }

  function showAdmin() {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-area").style.display = "block";
    loadPosts();
  }

  document.getElementById("login-btn").addEventListener("click", () => {
    const pw = document.getElementById("admin-password").value;
    if (pw === "Gummybear35!!") {
      showAdmin();
    } else {
      document.getElementById("login-error").textContent = "Invalid password";
    }
  });

  async function loadPosts() {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .order("date", { ascending: false });

    const list = document.getElementById("post-list");
    list.innerHTML = "";

    if (error) {
      list.innerHTML = "<li>Error loading posts</li>";
      return;
    }

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
  }

  document.getElementById("save-post").addEventListener("click", async () => {
    const title = document.getElementById("post-title").value;
    const date = document.getElementById("post-date").value;
    const content = document.getElementById("post-content").value;

    await supabase.from("posts").insert([{ title, date, content }]);
    loadPosts();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    showLogin();
  });

  // ✅ JSON Import handler moved OUTSIDE logout function
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
});

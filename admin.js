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

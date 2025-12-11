const API_BASE = "https://unknown-urbexer.onrender.com";
let token = localStorage.getItem("admin_token") || null;

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showLogin() {
  document.getElementById("login-box").style.display="block";
  document.getElementById("admin-area").style.display="none";
}

function showAdmin() {
  document.getElementById("login-box").style.display="none";
  document.getElementById("admin-area").style.display="block";
  loadPosts();
}

document.getElementById("login-btn").addEventListener("click", async ()=>{
  const pw = document.getElementById("admin-password").value;
  const res = await fetch(`${API_BASE}/api/login`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({password:pw})
  });
  const data=await res.json();
  if(res.ok){ token=data.token; localStorage.setItem("admin_token",token); showAdmin(); }
  else document.getElementById("login-error").textContent=data.error;
});

// LOAD POSTS
async function loadPosts() {
  const res=await fetch(`${API_BASE}/api/posts`);
  const posts=await res.json();
  document.getElementById("post-list").innerHTML="";
  posts.forEach(p=>{
    const li=document.createElement("li");
    li.textContent=`${p.title} — ${p.date}`;
    const del=document.createElement("button");
    del.textContent="Delete"; del.onclick=async()=>{
      await fetch(`${API_BASE}/api/posts/${p.id}`,{method:"DELETE",headers:authHeaders()});
      loadPosts();
    };
    li.appendChild(del);
    document.getElementById("post-list").appendChild(li);
  });
}

// SAVE POST
document.getElementById("upload-btn").addEventListener("click", async()=>{
  const files=document.getElementById("images").files;
  const form=new FormData();
  for(let f of files) form.append("images",f);
  const up=await fetch(`${API_BASE}/api/upload`, {method:"POST",headers: authHeaders(), body: form});
  const data=await up.json();
  alert("Uploaded images: "+data.files.map(x=>x.filename).join(", "));
});

document.getElementById("save-post").addEventListener("click", async()=>{
  const title=document.getElementById("post-title").value;
  const date=document.getElementById("post-date").value;
  const content=document.getElementById("post-content").value;
  await fetch(`${API_BASE}/api/posts`, {
    method:"POST",headers: {...authHeaders(),"Content-Type":"application/json"},
    body: JSON.stringify({title,date,content,images:[]})
  });
  loadPosts();
});

// BACKUP
document.getElementById("backup-btn").addEventListener("click", ()=>{
  window.location=`${API_BASE}/api/backup`;
});

// RESTORE
document.getElementById("restore-btn").addEventListener("click", async()=>{
  const f=document.getElementById("restore-file").files[0];
  const text=await f.text();
  const parsed=JSON.parse(text);
  await fetch(`${API_BASE}/api/restore`, {
    method:"POST", headers:{...authHeaders(),"Content-Type":"application/json"},
    body: JSON.stringify(parsed)
  });
  loadPosts();
});

// LOGOUT
document.getElementById("logout-btn").addEventListener("click", ()=>{
  localStorage.removeItem("admin_token");
  token=null;
  showLogin();
});

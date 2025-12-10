<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Panel</title>
    <link rel="stylesheet" href="style.css" />
    <style>
        body { background-color: #121212; color: #fff; font-family: Arial, sans-serif; }
        header, footer { text-align: center; padding: 10px; background-color: #1e1e1e; }
        section { max-width: 800px; margin: 20px auto; padding: 20px; background-color: #1e1e1e; border-radius: 8px; }
        input, textarea, button { width: 100%; margin: 5px 0; padding: 10px; border-radius: 4px; border: none; }
        textarea { height: 140px; }
        button { background-color: #e53935; color: white; cursor: pointer; }
        button:hover { background-color: #d32f2f; }
        .post-list li { padding: 10px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center; color: white; }
        .post-buttons { display: inline-flex; gap: 6px; }
        .post-buttons button { padding: 5px 10px; cursor: pointer; }
        #login-error, #import-status { color: red; }
        .small { width: auto; display: inline-block; margin-right: 8px; }
        #image-preview img { max-width: 120px; margin-right: 8px; margin-top: 8px; border-radius: 4px; }
    </style>
</head>
<body>
<header>
    <h1>Admin Panel</h1>
</header>

<section>

    <!-- Login box -->
    <div id="login-box">
        <h2>Admin Login</h2>
        <input type="password" id="admin-password" placeholder="Enter password" />
        <button id="login-btn">Login</button>
        <p id="login-error"></p>
    </div>

    <!-- Admin Area -->
    <div id="admin-area" style="display:none;">
        <h2>Add / Edit Post</h2>
        <input id="post-title" placeholder="Post Title" />
        <input id="post-date" type="date" />
        <textarea id="post-content" placeholder="Post Content (Markdown allowed)"></textarea>

        <label class="small">Attach images (optional)</label>
        <input id="post-images" type="file" accept="image/*" multiple />
        <div id="image-preview"></div>

        <button id="save-post">Save Post</button>

        <h2>Existing Posts</h2>
        <ul id="post-list" class="post-list"></ul>

        <h2>Backup / Restore</h2>
        <button id="export-posts">Export Posts to JSON</button>
        <input type="file" id="import-file" accept=".json" />
        <button id="import-posts">Import from JSON</button>
        <p id="import-status"></p>

        <button id="logout-btn" style="margin-top:8px;background:#333">Logout</button>
    </div>

</section>

<footer>
    <p>© 2025 Urban Explorer Log</p>
</footer>

<script src="admin.js"></script>
</body>
</html>

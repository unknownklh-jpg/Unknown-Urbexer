const API_BASE = 'https://your-render-backend-url.com'; // Update this

const form = document.getElementById('post-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const date = document.getElementById('date').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, date, password })
        });
        const data = await res.json();

        if (data.success) {
            alert('Post saved successfully!');
            form.reset();
        } else {
            alert('Error saving post: ' + data.error);
        }
    } catch (err) {
        alert('Network error');
        console.error(err);
    }
});

const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (like login.html)
app.use(express.static(__dirname));

// Simple user "database"
const USERS = {
    'user1': 'password123',
    'admin': 'adminpass'
};

// Serve login form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/multiplayer.html');
});

// Handle login form POST
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (USERS[username] && USERS[username] === password) {
        res.send(`<h1>Welcome, ${username}!</h1>`);
    } else {
        res.send(`<h1>Login failed</h1><p>Invalid credentials</p>`);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

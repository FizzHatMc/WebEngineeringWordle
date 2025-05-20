const express = require('express');
const { spawn } = require('child_process');
const portfinder = require('portfinder');
const app = express();
const path = require('path');
app.use(express.json());

const activeLobbies = new Map();

// Base port for lobby servers
portfinder.basePort = 3001;
app.use(express.static(path.join(__dirname)));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'lobby.html'));
});

app.post('/create-lobby', async (req, res) => {
    try {
        const lobbyId = generateId(5);
        const password = generateId(3);
        const port = await portfinder.getPortPromise();

        // Spawn new subserver
        const lobbyProcess = spawn('node', ['subserver.js',
            '--port', port,
            '--id', lobbyId,
            '--password', password
        ], {
            stdio: 'inherit', // Optional: inherit logs
        });

        // Store the lobby for tracking
        activeLobbies.set(lobbyId, {
            port,
            password,
            process: lobbyProcess
        });

        // Cleanup on exit
        lobbyProcess.on('exit', () => {
            activeLobbies.delete(lobbyId);
        });

        // Respond with a redirect URL to the client
        res.json({
            success: true,
            redirectUrl: `http://localhost:${port}/?id=${lobbyId}&password=${password}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Failed to create lobby'
        });
    }
});

function generateId(length) {
    return Math.random().toString(36).substr(2, length).toUpperCase();
}

app.listen(3000, () => {
    console.log('Main server running on port 3000');
});
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const lobbies = {};
const subServers = {}; // Keep track of sub-server processes

// Serve static files (lobby.html, game.html)
app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get('/', function(request, response) {
    response.sendFile(__dirname + "/lobby.html");
});

// Route for creating a new game (now starts a sub-server)
app.get('/create-game', (req, res) => {
    const gameId = uuidv4();
    const newWord = generateWord()
    const subServerPort = 4000 + Object.keys(subServers).length; // Simple port assignment
    // Start the sub-server as a separate Node.js process
    const subProcess = spawn('node', ['subserver.js', gameId, subServerPort, newWord]);

    if (!subProcess) {
        console.error(`Failed to start sub-server for game ${gameId}`);
        return res.status(500).json({ status: 'error', message: 'Failed to start game server' });
    }

    subServers[gameId] = {
        process: subProcess,
        port: subServerPort,
    };

    subProcess.stdout.on('data', (data) => {
        console.log(`Sub-process stdout: ${data}`);  //  <--  Capture stdout
    });

    subProcess.stderr.on('data', (data) => {
        console.error(`Sub-process stderr: ${data}`); //  <--  Capture stderr
    });

    subProcess.on('close', (code) => {
        console.log(`Sub-process exited with code ${code}`);
    });

    lobbies[gameId] = {
        players: [],
        word: newWord,
        gameOver: false,
        subServerPort: subServerPort, // Store the port
    };

    console.log(`Sub-server started for game ${gameId} on port ${subServerPort}, PID: ${subProcess.pid}`);
    res.json({ gameId, port: subServerPort}); // Include the port in the response
});

// Route for joining an existing game
app.get('/join-game', (req, res) => {
    const gameId = req.query.id;
    if (!gameId) {
        return res.status(400).json({ status: 'error', message: 'Game ID is required' });
    }

    if (!lobbies[gameId]) {
        return res.status(404).json({ status: 'error', message: 'Game not found' });
    }

    if (lobbies[gameId].players.length >= 6) {
        return res.status(400).json({ status: 'error', message: 'Game is full' });
    }

    res.json({ status: 'joined', port: lobbies[gameId].subServerPort }); //also send the port
});

app.post('/wordcheck', (req, res) => {
    const { gameId, word } = req.body; // Expecting gameId and the word
    console.log(`Main server received word check request for game ${gameId} with word: "${word}" -> Correct word: "${lobbies[gameId].word}"`);

    // --- Simulate word processing logic ---
    const result = false
    // --- End simulation ---

    // Send the response back to the sub-server
    res.json(result);
});


server.listen(PORT, () => {
    console.log(`Main server is running on http://localhost:${PORT}`);
});

function generateWord() {
    const words = ['apple', 'baker', 'chair', 'dance', 'early', 'fable', 'gamer', 'happy', 'igloo', 'jumbo', 'kiosk', 'lemon', 'magic', 'noble', 'ocean', 'piano', 'quick', 'rider', 'sable', 'table', 'uncle', 'video', 'waltz', 'xenon', 'yacht', 'zebra'];
    return words[Math.floor(Math.random() * words.length)].toUpperCase();
}
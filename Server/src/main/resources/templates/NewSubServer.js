const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path'); // Add this line

const app = express();
const server = http.createServer(app);
const gameId = process.argv[2] || 1;
const PORT = parseInt(process.argv[3], 10) || 4000;
const correctWord = process.argv[4];
const io = new Server(server, {
    transports: ["polling"],
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});



if (!gameId || !PORT || !correctWord) {
    console.error('Sub-server requires gameId, PORT and CorrectWord arguments.');
    process.exit(1);
}

const gameData = {
    players: [],
    word: correctWord,
    gameOver: false,
    submittedWords: [],
    port: PORT
}


// Handle /game route
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '/game_.html'));
});


app.post("/guess", (req, res) => {
    console.log("HTTP guess:", req.body);
    res.send({ ok: true });
});


io.on('connection', (socket) => {
    console.log(`Player ${socket.id} connected to game ${gameId} on port ${PORT}`);

    socket.on('join-game', ({gameId, playerName}) => {
        if (!gameId) {
            socket.emit('message', 'Game not found.');
            return;
        }

        socket.join(gameId);
        gameData.players.push({ id: socket.id, name: playerName, guesses: [] });
        socket.emit('game-start', {
            word: gameData.word,
            players: gameData.players,
            board: gameData.players.find(p => p.id === socket.id).guesses // Their current (empty) board
        });
        io.to(gameId).emit('player-list', gameData.players);
        console.log(`Player ${playerName} (${socket.id}) joined game ${gameId}`);


    });

    socket.on('guess',data => {
        console.log("Realtime guess:", data);

    });

    socket.on('new-game', ({ gameId, playerName }) => { // Expect playerName
        if (!gameId) {
            socket.emit('message', 'Game not found.');
            return;
        }


        gameData.gameOver = false;
        gameData.submittedWords = []; // Clear submitted words for new game

        // Reset guesses for all players
        gameData.players.forEach(p => {
            p.guesses = [];
        });

        // Notify all players in the game that a new game has started
        // Send initial board state for each player (empty guesses)
        io.to(gameId).emit('game-start', {
            word: gameData.word,
            players: gameData.players,
            board: [] // Everyone's board starts empty
        });
        console.log(`New game started in lobby ${gameId}, word is ${game.word}`);
    });

    socket.on('disconnect', () => {
        if (!gameId) return;

        const disconnectedPlayer = game.players.find(p => p.id === socket.id);
        gameData.players = gameData.players.filter(p => p.id !== socket.id);
        io.to(gameId).emit('player-list', game.players);
        console.log(`Player ${disconnectedPlayer ? disconnectedPlayer.name : socket.id} disconnected from game ${gameId} on port ${PORT}`);

        if (game.players.length === 0) {
            // Kill sub server if no players remain
            console.log(`No players left in game ${gameId}, shutting down sub-server.`);
            server.close(() => {
                process.exit(0);
            });
        }
    });

});

server.listen(PORT, () => {
    console.log(`Sub-server for game ${gameId} is running on http://localhost:${PORT}/game`);
})
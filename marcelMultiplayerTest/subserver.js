// subserver.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Allow all origins
        methods: ["GET", "POST"]
    }
});

const gameId = process.argv[2] || 1; // Get gameId from command line
const PORT = parseInt(process.argv[3], 10) || 4000; // Get port from command line

if (!gameId || !PORT) {
    console.error('Sub-server requires gameId and PORT arguments.');
    process.exit(1);
}

// Game state for this specific sub-server (lobby)
const game = {
    players: [], // Each player object will have { id, name, guesses[] }
    word: process.argv[4] || "nulll",
    gameOver: false,
    submittedWords: [] // Stores { word: "GUESS", player: "PlayerName" }
};

// Function to generate a random 5-letter word


io.on('connection', (socket) => {
    console.log(`Player ${socket.id} connected to game ${gameId} on port ${PORT}`);

    socket.on('join-game', ({ gameId, playerName }) => { // Expect playerName
        if (!gameId) {
            socket.emit('message', 'Game not found.');
            return;
        }

        const existingPlayer = game.players.find(p => p.id === socket.id);
        if (existingPlayer) {
            // Player is rejoining or already joined
            socket.emit('message', 'You are already in this game.');
            // Send current game state to the rejoining player
            socket.emit('game-start', {
                word: game.word,
                players: game.players,
                board: existingPlayer.guesses // Send their current guesses as their board
            });
            // Update submitted words list for the joining player
            game.submittedWords.forEach(sw => {
                socket.emit('update-board', { board: sw.word, playerName: sw.player }); // Re-send each submitted word
            });
            io.to(gameId).emit('player-list', game.players); // Ensure all players have updated list
            return;
        }

        if (game.players.length >= 6) {
            socket.emit('message', 'This game is full.');
            return;
        }

        socket.join(gameId);
        // Add new player with their name and an empty array for their guesses
        game.players.push({ id: socket.id, name: playerName, guesses: [] });

        // Send the initial game state to the player who just joined
        socket.emit('game-start', {
            word: game.word,
            players: game.players,
            board: game.players.find(p => p.id === socket.id).guesses // Their current (empty) board
        });
        // Update player list for everyone in the room
        io.to(gameId).emit('player-list', game.players);
        console.log(`Player ${playerName} (${socket.id}) joined game ${gameId}`);

        // Re-send existing submitted words to the new player
        game.submittedWords.forEach(sw => {
            // We need a proper way to update the 'submitted-words' list on new joins
            // The client's 'update-board' might not be suitable for this specific display.
            // Let's create a dedicated event for this list.
            socket.emit('add-submitted-word', { word: sw.word, playerName: sw.player });
        });
    });

    socket.on('guess', async ({gameId, guess, playerName}) => { // Expect playerName
        console.log(game.word)
        if (!gameId) {
            socket.emit('message', 'Game not found.');
            return;
        }

        const player = game.players.find(p => p.id === socket.id);
        if (!player) {
            console.error(`Player ${socket.id} not found in game ${gameId}`);
            return;
        }

        if (game.gameOver) {
            socket.emit('message', 'The game is over.');
            return;
        }

        const currentGuess = guess.toUpperCase();

        // Add the guess to the player's individual guesses
        player.guesses.push(currentGuess);

        // Add to the global submitted words list
        game.submittedWords.push({word: currentGuess, player: playerName});

        // Emit updated board for THIS player, and the submitting player's name
        io.to(gameId).emit('update-board', {
            board: player.guesses, // This is the 1D array of strings for this player
            playerName: playerName // Send the name of the player who made the guess
        });

        // In subserver.js
// ...
        setTimeout(async () => {
            console.log(`Sub-server ${gameId}: Requesting word check for "milch"`);
            try {
                const result = await sendReq('/wordcheck', { word: 'milch' }); // <-- THIS MUST BE '/try/{word}/{correct word}' or 'try/{word}/try-daily'
                console.log(`Sub-server ${gameId} received wordcheck result for "milch":`, result);
                // ...
            } catch (error) {
                console.error(`Sub-server ${gameId} wordcheck for "milch" failed:`, error);
            }
        }, 6000); // Or whatever timeout value you have


        // Check for win condition
        if (currentGuess === game.word) {
            game.gameOver = true;
            io.to(gameId).emit('game-over', {isWin: true, word: game.word, winner: playerName}); // Added winner
            console.log(`Player ${playerName} (${socket.id}) won game ${gameId}`);
        } else if (player.guesses.length >= 6) { // Check if player ran out of guesses
            let allPlayersGuessedMax = game.players.every(p => p.guesses.length >= 6);
            if (!game.gameOver && allPlayersGuessedMax) {
                game.gameOver = true;
                io.to(gameId).emit('game-over', {isWin: false, word: game.word});
                console.log(`All players exhausted guesses in game ${gameId}`);
            }
        }
    });

    socket.on('new-game', ({ gameId, playerName }) => { // Expect playerName
        if (!gameId) {
            socket.emit('message', 'Game not found.');
            return;
        }

        // Reset global game state
        game.word = generateWord();
        game.gameOver = false;
        game.submittedWords = []; // Clear submitted words for new game

        // Reset guesses for all players
        game.players.forEach(p => {
            p.guesses = [];
        });

        // Notify all players in the game that a new game has started
        // Send initial board state for each player (empty guesses)
        io.to(gameId).emit('game-start', {
            word: game.word,
            players: game.players,
            board: [] // Everyone's board starts empty
        });
        console.log(`New game started in lobby ${gameId}, word is ${game.word}`);
    });

    socket.on('disconnect', () => {
        if (!gameId) return;

        const disconnectedPlayer = game.players.find(p => p.id === socket.id);
        game.players = game.players.filter(p => p.id !== socket.id);
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

async function sendReq(requestType, data) {
    const postData = JSON.stringify({ gameId, ...data });
    const url = new URL("http://localhost:3000");

    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: requestType, // The specific endpoint, e.g., '/wordcheck'
        method: 'POST', // Assuming most requests will be POST with data
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        },
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    console.log(`Sub-server ${gameId} received response from ${requestType}:`, parsedData);
                    resolve(parsedData);
                } catch (e) {
                    console.error(`Sub-server ${gameId} error parsing response from ${requestType}: ${e.message}`);
                    reject(new Error(`Failed to parse response: ${rawData}`));
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Sub-server ${gameId} problem with request to ${requestType}: ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

server.listen(PORT, () => {
    console.log(`Sub-server for game ${gameId} is running on http://localhost:${PORT}`);
});
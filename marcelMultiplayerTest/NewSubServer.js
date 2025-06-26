const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path'); // Add this line

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const gameId = process.argv[2] || 1;
const PORT = parseInt(process.argv[3], 10) || 4000;
const correctWord = process.argv[4];

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

// Serve static files from the same directory
app.use(express.static(path.join(__dirname)));

// Handle /game route
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'), (err) => {
        if (err) {
            console.error('Error sending game.html:', err);
            res.status(500).send('Error loading game page');
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Game server ${gameId} running on port ${PORT}`);
    console.log(`Game word: ${correctWord}`);
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

    socket.on('guess',async({gameId, guess, playerName}) => {
        console.log("GameData.word -> " + gameData.word)
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
        player.guesses.push(currentGuess);
        gameData.submittedWords.push({word: currentGuess, player: playerName});

        io.to(gameId).emit('update-board', {
            board: gameData.submittedWords, // This is the 1D array of strings for this player
            playerName: playerName // Send the name of the player who made the guess
        });

        setTimeout(async  () => {
            try {
                if(isDaily){
                    const result = await fetch(`/try/${currentGuess}/try-daily`)
                }else{
                    const result = await fetch(`/try/${currentGuess}/${gameData.word}`)

                }
            }catch (error){
                console.log('ERROR Line 133')
            }
        }, 100)

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
})
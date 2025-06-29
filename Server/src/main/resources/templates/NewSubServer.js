const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path'); // Add this line

const app = express();
const server = http.createServer(app);
const id = process.argv[2] || 1;
const PORT = parseInt(process.argv[3], 10) || 4000;
const correctWord = process.argv[4];
const io = new Server(server, {
    transports: ["polling"],
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());  // **MUST BE BEFORE your routes**


if (!id || !PORT || !correctWord) {
    console.error('Sub-server requires id, PORT and CorrectWord arguments.');

    process.exit(1);
}

const map = new Map();

const gameData = {
    players: [],
    word: correctWord,
    gameOver: false,
    submittedWords: map
}


// Handle /game route
app.get('/game', (req, res) => {
    console.error(gameData.word + " - " + correctWord)
    res.sendFile(path.join(__dirname, '/game_.html'));
});

var guessCounter = 0

app.post("/guess", (req, res) => {
    console.log("HTTP guess:", req.body);
    const { gameId, guess, playerName } = req.body;

    guessCounter++


    if(gameData.submittedWords.size>=6){
        console.log("Done")
        res.send("Done")
        return
    }

    gameData.submittedWords.set(playerName+""+guessCounter,guess)
    console.log(gameData.submittedWords)


    fetch('http://localhost:8080/try/' + guess + "/" + gameData.word).then(r  => res.send(r))
    io.emit('updateAll', { message: 'Server processed update', guess });
});


let connectedClients = 0;

io.on("connection", (socket) => {
    connectedClients++;
    console.log("Client connected. Total:", connectedClients);

    socket.on("disconnect", async () => {
        connectedClients--;
        console.log("Client disconnected. Total:", connectedClients);

        if (connectedClients <= 0) {
            console.log("No clients left. Sending shutdown signal...");

            // Send signal to another server
            try {
                await fetch("http://other-server.local/api/shutdown", {
                    method: "POST"
                });
            } catch (e) {
                console.error("Failed to notify other server:", e);
            }

            // Kill the server process
            console.log("Shutting down this server...");
            server.close(() => {
                process.exit(0);
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Sub-server for game ${id} is running on http://localhost:${PORT}/game`);
})
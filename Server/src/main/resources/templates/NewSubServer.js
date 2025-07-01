const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path'); // Add this line
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const id = process.argv[2] || 1;
const PORT = parseInt(process.argv[3], 10) || 4000;
const correctWord = process.argv[4];
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const staticPath = path.join(__dirname, '..', 'static');
console.log('Static files path:', staticPath);
console.log('game.css exists:', fs.existsSync(path.join(staticPath, 'game.css')));

app.use('/static', express.static(staticPath, {
    fallthrough: false // Important: don't fall through to other routes
}));

// Error handler for missing static files
app.use('/static', (req, res) => {
    console.error(`Static file not found: ${req.path}`);
    res.status(404).send('Not found');
});

app.use(express.json());

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


app.get('/game', (req, res) => {
    console.error(gameData.word + " - " + correctWord)
    res.sendFile(path.join(__dirname, '/game_.html'));
});

let guessCounter = -1

app.post("/guess", (req, res) => {
    const { gameId, guess, playerName } = req.body;

    console.log(guessCounter)

    if(gameData.submittedWords.size>=6){
        console.log("Done")
        res.send("Done")
        return
    }

    gameData.submittedWords.set(playerName+""+guessCounter,guess)


    fetch('http://localhost:8080/try/' + guess + "/" + gameData.word).then(response => response.json()).then(r  => {
        //res.send(r);
        io.emit('updateAll',  {
            daten: r,
            word: guess,
            tries: guessCounter

        });
    });
    guessCounter++


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

            try {
                await fetch("http://localhost:8080/shutdown/"+id, {
                    method: "POST"
                });
            } catch (e) {
                console.error("Failed to notify other server:", e);
            }

            console.log("Shutting down this server...");
            server.close(() => {
                process.exit(0);
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Sub-server for game ${id} is running on http://localhost:${PORT}/game`);
})
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path'); // Add this line
const fs = require('fs');
const {response} = require("express");

const app = express();
const server = http.createServer(app);
const id = process.argv[2] || 1;
const PORT = parseInt(process.argv[3], 10) || 4000;
const lobbytype = process.argv[4];

const map = new Map();
const gameData = {
    players: [],
    word: "",
    word2: "",
    gameOver: false,
    submittedWords: map
}
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const staticPath = path.join(__dirname, '..', 'static');
app.use('/static', express.static(staticPath, {
    fallthrough: false
}));
app.use('/static', (req, res) => {
    console.error(`Static file not found: ${req.path}`);
    res.status(404).send('Not found');
});
app.use(express.json());
if (!id || !PORT) {
    console.error('Sub-server requires id, PORT arguments.');

    process.exit(1);
}




fetch("http://localhost:8080/getNewWord")
    .then(response => response.json())
    .then(data => {
        console.log("NewWord -> " + data.word)
        gameData.word = data
    })

if(lobbytype==="1v1"){
    fetch("http://localhost:8080/getNewWord")
        .then(response => response.json())
        .then(data => {
            console.log("NewWord -> " + data.word)
            gameData.word2 = data
        })
}


app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '/game_.html'));
});

let guessCounter = -1

app.post("/guess", (req, res) => {
    const { gameId, guess, playerName } = req.body;

    console.log(guessCounter)

    if(gameData.submittedWords.size>=5){
        console.log("Done")
        gameData.gameOver=true
        res.send({
            gameOver: gameData.gameOver,
            won: false
        });
        return
    }

    gameData.submittedWords.set(playerName+""+guessCounter,guess)


    fetch('http://localhost:8080/try/' + guess + "/" + gameData.word).then(response => response.json()).then(r  => {
        if(r.toString().replaceAll(" ","") === "3,3,3,3,3"){
            console.log("Correct word ")
            gameData.gameOver = true

            res.send({
                gameOver: gameData.gameOver,
                won: true
            });

        }

        io.emit('updateAll',  {
            daten: r,
            word: guess,
            tries: guessCounter

        });

    });
    guessCounter++
});


app.post("/guessDaily", (req, res) => {
    const { gameId, guess, playerName } = req.body;

    console.log("Daily ->" + guessCounter)

    if(gameData.submittedWords.size>=5){
        console.log("Done")
        gameData.gameOver=true
        res.send({
            gameOver: gameData.gameOver,
            won: false
        });
        return
    }

    gameData.submittedWords.set(playerName+""+guessCounter,guess)


    fetch('http://localhost:8080/try/' + guess
    ).then(response => response.json()).then(r  => {

        if(r.toString().replaceAll(" ","") === "3,3,3,3,3"){
            console.log("Correct word ")
            gameData.gameOver = true

            res.send({
                gameOver: gameData.gameOver,
                won: true
            });
        }

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
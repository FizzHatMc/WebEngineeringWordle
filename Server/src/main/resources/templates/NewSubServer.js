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
console.log("Lobby -> " + lobbytype)

const map = new Map();
const gameData = {
    players: [],
    word: "",
    word2: "",
    gameState: -1,
    submittedWords: [[],[]],
    guessCounter: [0,0],

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
        gameData.word = data.word


    })

if(lobbytype==="1v1"){
    fetch("http://localhost:8080/getNewWord")
        .then(response => response.json())
        .then(data => {
            console.log("NewWord2 -> " + data.word)
            gameData.word2 = data.word

        })
}

if(lobbytype==="1v1") {
    app.get('/game', (req, res) => {
        res.sendFile(path.join(__dirname, '/game_1v1.html'));
    });
}else if(lobbytype==="team" || lobbytype==="solo"){
    app.get('/game', (req, res) => {
        res.sendFile(path.join(__dirname, '/game_.html'));
    });
}


function updateAll(boardX, r, guess, guessCounter,playerID) {
    console.log("BoardID -> " + boardX + " Guess -> " + guess + " GuessCounter -> " + guessCounter)
    io.emit('updateAll',  {
        board: boardX,
        daten: r,
        word: guess,
        tries: guessCounter

    });
    gameData.guessCounter[playerID-1]++

}

function guess(fetchURL,req,res){
    const { gameId, guess, playerName } = req.body;
    let playerID = gameData.players.indexOf(playerName) + 1

    gameData.submittedWords[playerID-1][gameData.guessCounter[playerID-1]] = guess;

    insertGuess(playerName,guess)
    let correctWord
    if(playerID === 1){
        correctWord = gameData.word
    }else {
        correctWord = gameData.word2
    }

    fetch(fetchURL + guess + "/" + correctWord).then(response => response.json()).then(r  => {
        if(r.toString().replaceAll(" ","") === "3,3,3,3,3"){
            gameData.gameOver = 1
            res.send({
                gameState: gameData.gameState,
                playerName: playerName
            });
        }



        const boardX = gameData.players.indexOf(playerName) + 1

        updateAll(boardX,r,guess,gameData.guessCounter[playerID-1],playerID)

        if(gameData.guessCounter[playerID-1]>=6){
            console.log("Done Player " + playerID)
            gameData.gameState=0
            res.send({
                gameOver: gameData.gameState,
                playerName: playerName
            });

        }
    });
}

app.post("/guess", (req, res) => {
    guess("http://localhost:8080/try/",req,res)
});

app.post("/guessDaily", (req, res) => {
    guess("http://localhost:8080/try/",req,res)
});

let connectedClients = 0;

io.on("connection", (socket) => {
    connectedClients++;
    console.log("Client connected. Total:", connectedClients);
    const originalUrl = socket.handshake.query.originalUrl;
    const getName = (url) => {
        if (!url) return null;
        try {
            return new URLSearchParams(url.split('?')[1]).get("name");
        } catch (e) {
            console.error("Error parsing URL:", e);
            return null;
        }
    };
    console.log("Name -> " + getName(originalUrl))
    gameData.players.push(getName(originalUrl))

    if(connectedClients>1){
        io.emit('playerJoined', {
            name: getName(originalUrl)
        })
    }

    socket.on("disconnect", async () => {
        connectedClients--;
        console.log("Client disconnected. Total:", connectedClients);

        gameData.players = gameData.players.filter(p => p !== getName(originalUrl));
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

function insertGuess(playerName, guess) {
    const index = gameData.players.indexOf(playerName);
    if (index === -1) return console.log("Player not found");
    gameData.submittedWords[index].push(guess);
}
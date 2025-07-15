import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve();
const app = express();
const server = http.createServer(app);
const id = process.argv[2] || 1;
const PORT = parseInt(process.argv[3], 10) || 4000;
const lobbytype = process.argv[4];

const RESOURCES_ROOT = process.env.RESOURCES_PATH || '/tmp/wordle-resources';
const TEMPLATES_PATH = path.join(RESOURCES_ROOT, 'templates');
const STATIC_PATH = path.join(RESOURCES_ROOT, 'static');



// Verify paths exist
console.log(`Templates path: ${TEMPLATES_PATH}`);
console.log(`Static files path: ${STATIC_PATH}`);

// Configure static files
app.use('/static', express.static(STATIC_PATH, {
    fallthrough: false,
    setHeaders: (res) => {
        res.set('Cache-Control', 'public, max-age=3600');
    }
}));

// Error handler for static files
app.use('/static', (req, res) => {
    console.error(`Static file not found: ${req.path}`);
    res.status(404).send('Not found');
});

// Template routes
app.get('/game', (req, res) => {
    const fileName = lobbytype === "1v1" ? 'game_1v1.html' : 'game_.html';
    const filePath = path.join(TEMPLATES_PATH, fileName);

    console.log(`Serving template: ${filePath}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Failed to send template:', err);
            if (!res.headersSent) {
                res.status(500).send('Error loading game template');
            }
        }
    });
});

const gameData = {
    players: [],
    word: "",
    word2: "",
    gameState: -1,
    submittedWords: [[],[]],
    guessCounter: [0,0],
    globalCounter: 0
}
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
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




function updateAll(r, guess, guessCounter,playerID) {
    console.log("BoardID -> " + playerID + " Guess -> " + guess + " GuessCounter -> " + guessCounter + " r -> " + r)
    io.emit('updateAll',  {
        //board: boardX,
        playerID: playerID,
        daten: r,
        word: guess,
        tries: guessCounter

    });

    if(lobbytype==="team" || lobbytype==="solo"){
        gameData.globalCounter++
    }else if(lobbytype==="1v1"){
        gameData.guessCounter[playerID-1]++
    }

}

function guess(fetchURL,req,res){
    const { gameId, guess, playerName } = req.body;
    let playerID = gameData.players.indexOf(playerName) + 1
    console.log("Guess > " + guess)
    gameData.submittedWords[playerID-1][gameData.guessCounter[playerID-1]] = guess;

    insertGuess(playerName,guess)
    let correctWord

    if(lobbytype==="1v1"){
        if(playerID === 1){
            correctWord = gameData.word
        }else {
            correctWord = gameData.word2
        }
    }else{
        correctWord = gameData.word
    }

    fetch(fetchURL + guess + "/" + correctWord).then(response => response.json()).then(r  => {
        if(r.toString().replaceAll(" ","") === "3,3,3,3,3"){
            gameData.gameState = 2
            io.emit('endGame', {
                gameState: gameData.gameState,
                playerID: playerID
            });
        }

        if(lobbytype==="team" || lobbytype==="solo"){
            updateAll(r,guess,gameData.globalCounter,playerID)
        }else if(lobbytype==="1v1" ){
            updateAll(r,guess,gameData.guessCounter[playerID-1],playerID)
        }

        if(gameData.guessCounter[playerID-1]>=6 || gameData.globalCounter >= 6){
            console.log("Done Player " + playerID)
            gameData.gameState = 0
            io.emit('endGame', {
                gameState: gameData.gameState,
                playerID: playerID
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
            namen: gameData.players

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
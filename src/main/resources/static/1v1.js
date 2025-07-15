const rows = 6;
const cols = 5;
const colorArray = [];
const letterArray = [];
const port = window.location.port;

const socket = io("http://localhost:"+port, {
    query: {
        originalUrl: window.location.pathname + window.location.search
    }
});
let tries = 0;
let word = document.getElementById("guess").value;

const gameId = new URLSearchParams(window.location.search).get('id');
const host = window.location.hostname;
const playerName = new URLSearchParams(window.location.search).get('name'); // Get player name
const slider = new URLSearchParams(window.location.search).get('daily');
let playerID;

document.getElementById("link2home").setAttribute("href",`http://${host}:8080`);
document.getElementById("homelink").setAttribute("href",`http://${host}:8080`);
document.getElementById("impressumlink").setAttribute("href",`http://${host}:8080/impressum`);


for (let i = 0; i < rows; i++) {
    colorArray[i] = []; // Erstelle eine neue Zeile (inneres Array)
    letterArray[i] = []; // Erstelle eine neue Zeile (inneres Array)
    for (let j = 0; j < cols; j++) {
        colorArray[i][j] = 0;
        letterArray[i][j] = '';
    }
}

socket.on('updateAll', (send) => {
    updateBoard(send.playerID,send.daten,send.word,send.tries);
    //send.board,
})


tilesErstellen(board1);
tilesErstellen(board2);

document.getElementById("copy-id").innerHTML = "Game-ID: " + gameId;

function tilesErstellen(board){
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            board.appendChild(tile);
        }
    }
}

function updateBoard(playerID,data,word,test){
    let board;
    let tries = test
    console.log("PlayerID send -> " + playerID + " Own ID -> " + this.playerID)
    if(playerID===this.playerID){
        board = document.getElementById("board1");

    }else{
        board = document.getElementById("board2");
    }

    for (let i = 0; i < colorArray[tries].length; i++) {
        colorArray[tries][i] = data[i];
        letterArray[tries][i] = word[i];
    }
    board.replaceChildren(); // Entfernt alle Kindelemente
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const tile = document.createElement('div');
            tile.textContent = letterArray[row][col];
            tile.classList.add('tile');
            if (colorArray[row][col] === 1) tile.classList.add('tileabsent');
            if (colorArray[row][col] === 2) tile.classList.add('tilepresent');
            if (colorArray[row][col] === 3) tile.classList.add('tilecorrect');
            board.appendChild(tile);
        }
    }
}

function sendGuessHTTP() {
    word = document.getElementById("guess").value;
    if(word.length!==5) return;
    document.getElementById("guess").value = "";
    if(slider){
        console.log("Daily")
        fetch("/guessDaily",{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gameId: gameId,
                guess: word,
                playerName: playerName,
            })
        }).then(response => response.json())
            .then(data => {
                console.log("GameOver -> " + data.gameOver)
                gameOverScreen();
                word = '';
                document.getElementById("guess").value = "";
            })
            .catch(error => console.error('Fehler beim Abrufen der Daten (bei Daily):', error));
    }else{
        fetch("/guess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gameId: gameId,
                guess: word,
                playerName: playerName,
            })
        }).then(response => response.json())
            .then(data => {
                console.log("GameOver -> " + data);
                gameOverScreen();
                word = '';
                document.getElementById("guess").value = "";
            })
            .catch(error => console.error('Fehler beim Abrufen der Daten (in tryWord):', error));
    }
}

socket.on('endGame', (send) => {

    if(this.playerID!==send.playerID){
        gameOverScreen(1);
    }else{
        gameOverScreen(send.gameState);
    }
})

function gameOverScreen(endState){
    document.getElementById("guess").style.display = "none";
    document.getElementById("send-guess").style.display = "none";
    switch (endState){
        case -1:
            document.getElementById("error").style.display = "block";
            break;
        case 0:
            document.getElementById("gameover").style.display = "block";
            break;
        case 1:
            document.getElementById("enemy").style.display = "block";
            break;
        case 2:
            document.getElementById("won").style.display = "block";
            break;
        default:
            document.getElementById("error").style.display = "block";
    }
}

socket.on('playerJoined', (send) => {
    this.playerID = send.namen.indexOf(playerName) + 1

    for(let i=0;i<send.namen.length;i++){
        if(send.namen[i]!==playerName){
            gegnerJoined(send.namen[i])
        }
    }


})


function gegnerJoined(gegnername) {
    document.getElementById("guess").style.display = "block";
    document.getElementById("send-guess").style.display = "block";
    document.getElementById("gegnername").innerHTML = "Gegner: " + gegnername;
}

function copyId(){
    // Copy the text inside the text field
    navigator.clipboard.writeText(gameId);

    // Alert the copied text
    alert("ID in Zwischenablage kopiert!");
}
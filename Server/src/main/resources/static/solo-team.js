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

document.getElementById("copy-id").innerHTML = "Game-ID: " + gameId;
if(playerName === "solo"){
    document.getElementById("copy-id").style.display = "none";
}

socket.on('updateAll', (send) => {
    updateBoard(send.daten,send.word,send.tries);
})

const board = document.querySelector('.wordle-board');
// erstellt die Tiles
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        board.appendChild(tile);
    }
}

function updateBoard(data,word,tries){

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
    darkmode();
}

function sendGuessHTTP() {
    word = document.getElementById("guess").value;
    console.log("Word -> " + word)
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
    gameOverScreen(send.gameState);
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

function copyId(){
    // Copy the text inside the text field
    navigator.clipboard.writeText(gameId);

    // Alert the copied text
    alert("ID in Zwischenablage kopiert!");
}

let sliderDM = document.getElementById("darkMode");
function darkmode(){
    if(sliderDM.checked){
        document.body.style.backgroundColor = "#001536"; // nur für Augengesundheits-Zwecke
        changeBackground("tile","#292929");
        changeBackground("tilepresent","#968a00");
        changeBackground("tilecorrect","#077a33");
        //changeBackground("tileabsent","#630012");
        changeBackground("tileabsent","#4e5259");
    }else{
        document.body.style.backgroundColor = "white";
        changeBackground("tile","#D5FFF3");
        changeBackground("tilepresent","#FFE058");
        changeBackground("tilecorrect","#76E66C");
        changeBackground("tileabsent","#D6CBD7");
    }
}

function changeBackground(classname, color){
    tiles = document.getElementsByClassName(classname);
    for(let tile of tiles){
        tile.style.backgroundColor = color;
    }
}
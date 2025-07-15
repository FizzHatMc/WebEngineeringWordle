const gameIdInput = document.getElementById('game-id-input');
const nameInput = document.getElementById('name-input');
const errorMessageDisplay = document.getElementById('error-message');
let modus="1v1";
let daily="daily";

function joinGame(){
    const gameId = gameIdInput.value.trim();

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let playerName = urlParams.get('name');

    if(!playerName){
        playerName = nameInput.value.trim();
    }

    if (!playerName) {
        showError('Kein Name ¯\\_(ツ)_/¯');
        document.getElementById("name-input").style.display = "block";
        return;
    }
    if (!gameId) {
        showError('Bitte eine Game ID angeben.');
        return;
    }
    fetch(`/join-game?id=${gameId}`)

        .then(response => response.json())
        .then(data => {
            console.log(data)

            if (data.status === 'joined') {
                navigateToGame(gameId, data.message, playerName);
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error joining game:', error);
            showError('Es ist ein Fehler aufgetreten. Bitte Verbindung überprüfen.');
        });
}

function showError(message) {
    errorMessageDisplay.textContent = message;
}

function showCreateGame() {
    const playerName = nameInput.value.trim();
    if (!playerName) {
        showError('Bitte einen Namen angeben.');
        return;
    }
    document.getElementById("modus-anweisung").className = "visible";
    document.getElementById("anweisung").className = "hidden";
}

function navigateToGame(gameId, port, playerName) {
    const targetHost = window.location.hostname; // Keeps same domain (e.g., localhost or example.com)
    let dailyAnhang = ""
    if(daily){
        dailyAnhang = "&daily=" + daily;
    }
    const targetPath = "/game?id="+gameId+"&name="+encodeURIComponent(playerName)+dailyAnhang;  // Change to the desired path on that server if needed

    // Navigate to the new port
    window.location.href = `http://${targetHost}:${port}${targetPath}`;
}

function toggleDaily(){
    if(daily){
        daily = "";
        document.getElementById("daily").innerHTML = "Daily: aus";
        document.getElementById("daily").className = "toggle-button is-off";
    } else {
        daily = "oiiai";
        document.getElementById("daily").innerHTML = "Daily: aktiv";
        document.getElementById("daily").className = "toggle-button is-active";
    }
}

function createGame(){
    console.log("Button pressed")
    const playerName = nameInput.value.trim();
    modus = document.querySelector('input[name = "modus"]:checked').value;
    if (!playerName) {
        showError('Bitte einen Namen angeben.');
        return;
    }
    console.log(modus);
    fetch('/create-game/'+modus)
        .then(response => response.json())
        .then(data => {
            if (data.gameId && data.port) {
                navigateToGame(data.gameId, data.port, playerName);
            } else {
                showError('Es konnte kein Spiel erstellt werden. Bitte nochmal versuchen.');
            }
        })
        .catch(error => {
            console.error('Error creating game:', error);
            showError('Es ist ein Fehler aufgetreten. Bitte Verbindung überprüfen.');
        });
}

function route2joinGame() {
    const playerName = nameInput.value.trim();
    if (!playerName) {
        showError('Bitte einen Namen angeben.');
        return;
    }
    document.location=('/spielbeitritt?name=' + encodeURIComponent(playerName));
}
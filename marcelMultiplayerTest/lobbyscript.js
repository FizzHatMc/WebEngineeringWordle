const gameIdInput = document.getElementById('game-id-input');
const nameInput = document.getElementById('name-input');
const errorMessageDisplay = document.getElementById('error-message');

function showError(message) {
    errorMessageDisplay.textContent = message;
}

function navigateToGame(gameId, port, playerName) {
    // Use relative path and include the port and player name
    window.location.href = `game.html?id=${gameId}&port=${port}&name=${encodeURIComponent(playerName)}`;
}

function createGame(){
    console.log("Button pressed")
    const playerName = nameInput.value.trim();
    if (!playerName) {
        showError('Please enter your name.');
        return;
    }
    fetch('/create-game')
        .then(response => response.json())
        .then(data => {
            if (data.gameId && data.port) {
                navigateToGame(data.gameId, data.port, playerName);
            } else {
                showError('Failed to create game. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error creating game:', error);
            showError('An error occurred. Please check your network connection.');
        });
}

function joinGame(){
    const gameId = gameIdInput.value.trim();
    const playerName = nameInput.value.trim();
    if (!playerName) {
        showError('Please enter your name.');
        return;
    }
    if (!gameId) {
        showError('Please enter a Game ID.');
        return;
    }
    fetch(`/join-game?id=${gameId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'joined') {
                navigateToGame(gameId, data.port, playerName);
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('Error joining game:', error);
            showError('An error occurred. Please check your network connection.');
        });
}


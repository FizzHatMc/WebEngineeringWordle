const socket = io(`http://lobby-server-ip:PORT`, { query: { token: 'MAIN_SERVER_TOKEN' } });

// Send guess to server
function submitGuess(guess) {
    socket.emit('submit-guess', guess);
}

// Listen for updates
socket.on('update', (guesses) => {
    updateUI(guesses);
});



function createLobby() {
    fetch('/create-lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Add more data if needed
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirectUrl; // Redirect user to the new subserver
            } else {
                console.error('Lobby creation failed:', data.error);
                alert('Failed to create lobby');
            }
        })
        .catch(err => {
            console.error('Request failed:', err);
        });
}


function showJoinForm() {
    document.getElementById('joinForm').style.display = 'block';
}

function joinLobby() {
    const lobbyId = document.getElementById('lobbyId').value;
    const password = document.getElementById('password').value;

    if (lobbyId && password) {
        window.location.href = `game.html?id=${lobbyId}&password=${password}`;
    }
}

// Get lobby parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const lobbyId = urlParams.get('id');
const lobbyPassword = urlParams.get('password');

// Display lobby info
document.getElementById('lobbyId').textContent = lobbyId;
document.getElementById('lobbyPassword').textContent = lobbyPassword;

function submitGuess() {
    const input = document.getElementById('guessInput');
    const guess = input.value.toUpperCase();

    if (guess.length === 5) {
        const div = document.createElement('div');
        div.className = 'guess';
        div.textContent = `You guessed: ${guess}`;

        document.getElementById('results').appendChild(div);
        input.value = '';
    } else {
        alert('Please enter a 5-letter word!');
    }
}
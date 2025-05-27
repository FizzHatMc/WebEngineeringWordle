const gameId = new URLSearchParams(window.location.search).get('id');
const port = new URLSearchParams(window.location.search).get('port');
const playerName = new URLSearchParams(window.location.search).get('name'); // Get player name
const socket = io(`http://localhost:${port}/?id=${gameId}`); // Connect to the sub-server

const boardElement = document.getElementById('board');
const textInput = document.getElementById('text-input');
const submitButton = document.getElementById('submit-button');
const messageContainer = document.getElementById('message-container');
const gameOverModal = document.getElementById('game-over-modal');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');
const newGameButton = document.getElementById('new-game-button');
const playerListElement = document.getElementById('player-list');
const wordListElement = document.getElementById('word-list');
const toggle = document.getElementById('dailySwitch');

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

let board = []; // This will now be an array of strings
let currentRow = 0;
let currentGuess = ''; // This will hold the current word being typed
let solutionWord = ''; // Renamed 'word' to 'solutionWord' to avoid confusion

let isGameOver = false;
let playerId = '';
let players = [];
let submittedWords = [];
let isDaily = true

function createBoard() {
    board = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
        board.push('');
    }
    board[currentRow] = currentGuess;
}

function renderBoard() {
    console.log("Current board state:", board);
    boardElement.innerHTML = ''; // Clear the board

    if (!board || !Array.isArray(board)) {
        console.error("Board is not defined or is not an array:", board);
        return;
    }

    board.forEach((word, wordIndex) => { // 'word' is now correctly a string
        // Ensure the word is at least an empty string to prevent errors
        if (typeof word !== 'string') {
            console.error("Board element is not a string:", word, "Word Index:", wordIndex);
            word = ''; // Default to empty string to continue rendering
        }

        // Pad the word with empty spaces if it's shorter than WORD_LENGTH for display
        // This ensures all 5 tiles are always rendered for each row
        const displayWord = word.padEnd(WORD_LENGTH, ' ');

        for (let letterIndex = 0; letterIndex < WORD_LENGTH; letterIndex++) {
            const letter = displayWord[letterIndex];

            const tile = document.createElement('div');
            tile.className = 'tile';
            const tileInner = document.createElement('div');
            tileInner.className = 'tile-inner';
            tileInner.textContent = letter.trim(); // Trim to not show spaces in tiles

            const isSubmittedWord = (word.length === WORD_LENGTH && wordIndex < currentRow);
            const isCurrentPlayerTypingRow = (wordIndex === currentRow && currentGuess.length < WORD_LENGTH);


            if (solutionWord && (isSubmittedWord || (wordIndex === currentRow && word.length === WORD_LENGTH))) {
                const letterUpper = letter.toUpperCase();
                const solutionUpper = solutionWord.toUpperCase();

                if (letterUpper === solutionUpper[letterIndex]) {
                    tile.classList.add('correct');
                } else if (solutionUpper.includes(letterUpper)) {
                    // This 'present' logic needs refinement for strict Wordle rules
                    // (counting occurrences of letters in solution to avoid over-marking)
                    // For a basic implementation, this is often sufficient.
                    tile.classList.add('present');
                } else {
                    tile.classList.add('absent');
                }
            } else if (isCurrentPlayerTypingRow && currentRow === wordIndex) {
                // For the row the current player is typing in, don't apply colors yet
                // Only show the letters they have typed. This is implicitly handled by textContent.
                // If you want to show empty boxes for untyped letters in the current row:
                // The padding ' ' above handles this.
            }

            tile.appendChild(tileInner);
            boardElement.appendChild(tile);
        }
    });
}

// This function will be called on keyup/input to update the local board state
// before a guess is submitted to the server.
function updateCurrentGuessDisplay() {
    currentGuess = textInput.value.toUpperCase();
    // Ensure the board array has enough elements for the current row
    if (board.length <= currentRow) {
        // This case should ideally not happen if createBoard initializes correctly
        // or if updateBoard from server always sets enough rows.
        // But as a fallback, ensure the row exists.
        while (board.length <= currentRow) {
            board.push('');
        }
    }
    board[currentRow] = currentGuess;
    renderBoard(); // Re-render the board with the current partial guess
}


function handleGuessSubmit() {
    if (isGameOver) return;

    const guess = textInput.value.trim();
    if (guess.length === WORD_LENGTH) {
        // Before sending, ensure the board is updated with the final current guess
        // This is effectively "locking in" the currentGuess into the board state
        board[currentRow] = guess.toUpperCase();
        socket.emit('guess', { gameId, guess, playerName }); // Send guess and player name
        textInput.value = ''; // Clear input after submission
        currentGuess = ''; // Clear currentGuess after submission
        // We don't increment currentRow here. The server will tell us the new currentRow.
    } else {
        showMessage('Not enough letters!');
    }
}

function showMessage(message) {
    const messageElement = messageContainer;
    messageElement.textContent = message;
    messageElement.classList.add('show-message');
    setTimeout(() => {
        messageElement.classList.remove('show-message');
    }, 3000);
}

// updateBoard now expects a 1D array of strings
function updateBoard(newBoard) {
    board = newBoard; // Directly replace the board with the server's state
    // When the server sends an update, it represents the full history of guesses
    // So we need to re-evaluate the currentRow based on the received board
    currentRow = newBoard.length; // The next guess will go to the end of this array
    // We also need to make sure 'board' has enough empty rows for future guesses
    while (board.length < MAX_GUESSES) {
        board.push(''); // Add empty strings for remaining guess slots
    }
    renderBoard();
}

function displayGameOver(isWin, word) {
    isGameOver = true;
    gameOverTitle.textContent = isWin ? 'Congratulations!' : 'Game Over!';
    gameOverMessage.textContent = isWin
        ? 'You guessed the word!'
        : `The word was ${word.toUpperCase()}. Better luck next time!`;
    gameOverModal.classList.add('show');
}

function resetGame() {
    createBoard(); // Reset board to empty strings
    currentRow = 0;
    currentGuess = '';
    isGameOver = false;
    gameOverModal.classList.remove('show');
    socket.emit('new-game', { gameId, playerName }); // Emit new-game event with playerName
    submittedWords = [];
    wordListElement.innerHTML = '';
    renderBoard(); // Ensure the board is rendered when resetting.
}

function changeDailyState(check){
    socket.emit('dailyState', {check});
}

function updateSubmittedWords(newWord, playerName) {
    submittedWords.push({ word: newWord, player: playerName });
    const li = document.createElement('li');
    li.textContent = `${playerName}: ${newWord.toUpperCase()}`; // Display "Name: Word" in uppercase
    wordListElement.appendChild(li);
    wordListElement.scrollTop = wordListElement.scrollHeight; // Scroll to bottom
}

newGameButton.addEventListener('click', resetGame);
submitButton.addEventListener('click', handleGuessSubmit);
textInput.addEventListener('input', updateCurrentGuessDisplay);// Listen for input changes
toggle.addEventListener('change', () => {
    if (toggle.checked) {
        console.log("Slider -> " + toggle.checked)
        document.getElementById("p1").innerText= toggle.checked + "!"
        changeDailyState(true)
    } else {
        console.log("Slider -> " + toggle.checked)
        changeDailyState(false)
    }
});



socket.on('connect', () => {
    playerId = socket.id;
    socket.emit('join-game', { gameId, playerName }); // Send player name on join
});

socket.on('game-start', (data) => {
    solutionWord = data.word; // Set the solution word
    createBoard(); // Initialize the board with empty strings
    renderBoard(); // Render the empty board
    if (data.players) {
        players = data.players;
        updatePlayerList(data.players);
    }
    // If there are already guesses (e.g., player joined mid-game), update board
    if (data.board) {
        updateBoard(data.board);
    }
});

socket.on('update-board', (data) => {
    if (data && data.board && Array.isArray(data.board)) {
        // Update the board with the server's full state of guesses
        updateBoard(data.board);

        // Logic to add the last submitted word to the submittedWords list
        // The server sends the *entire* board state, so the last guess
        // is the last element in data.board.
        if (data.board.length > 0) {
            const lastGuessedWord = data.board[data.board.length - 1]; // Get the last submitted word
            const emittingPlayerName = data.playerName; // The server needs to send this with the update-board event
            updateSubmittedWords(lastGuessedWord, emittingPlayerName);
        }
    } else {
        console.error("data is undefined, data.board is undefined or not an array:", data);
    }
});

socket.on('game-over', (data) => {
    displayGameOver(data.isWin, data.word);
    isGameOver = true;
});

socket.on('message', (message) => {
    showMessage(message);
});

socket.on('player-list', (updatedPlayers) => {
    players = updatedPlayers;
    updatePlayerList(updatedPlayers);
});

function updatePlayerList(playerList) {
    playerListElement.innerHTML = ''; // Clear the list
    playerList.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.id === playerId ? `You (${player.name})` : `${player.name}`; // Display "You"
        if (player.id === playerId) {
            li.id = "current-player";
        }
        playerListElement.appendChild(li);
    });
}

// Initial setup
createBoard();
renderBoard();
const express = require('express');
const path = require("path");
const args = require('minimist')(process.argv.slice(2));

const app = express();
const port = args.port;
const lobbyId = args.id;
const password = args.password;

app.use(express.static(path.join(__dirname)));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'game.html'));
});

app.get('/info', (req, res) => {
    res.json({
        lobbyId,
        password,
        status: 'active'
    });
});

app.listen(port, () => {
    console.log(`Lobby server ${lobbyId} running on port ${port}`);
});
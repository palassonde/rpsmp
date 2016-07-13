var util = require('util')
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')
var io = require('socket.io')

var Player = require('./Player')

var port = process.env.PORT || 8080

var socket
var players

// Create and start the http server
var server = http.createServer(
    ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
    if (err) {
        throw err
    }

    init()
})

function init () {
    // Create an empty array to store players
    players = []

    // Attach Socket.IO to server
    socket = io.listen(server)

    // Start listening for events
    setEventHandlers()
}

var setEventHandlers = function () {
    // Socket.IO
    socket.sockets.on('connection', onSocketConnection)
}

// New socket connection
function onSocketConnection (client) {
    util.log('New player has connected: ' + client.id)

    // Listen for client disconnected
    client.on('disconnect', onClientDisconnect)

    // Listen for new player message
    client.on('new player', onNewPlayer)

    // Listen for change player option message
    client.on('change player option', onChangePlayerOption)
}

// Socket client has disconnected
function onClientDisconnect () {
    util.log('Player has disconnected: ' + this.id)

    var removePlayer = playerById(this.id)

    // Player not found
    if (!removePlayer) {
        util.log('Player not found: ' + this.id)
        return
    }

    // Remove player from players array
    players.splice(players.indexOf(removePlayer), 1)

    // Broadcast removed player to connected socket clients
    this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
    // Create a new player
    var newPlayer = new Player()
    newPlayer.id = this.id

    // Broadcast new player to connected socket clients
    this.broadcast.emit('new player', {id: newPlayer.id})

    // Send existing players to the new player
    var i, existingPlayer
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i]
        this.emit('new player', {id: existingPlayer.id})
    }
    // Add new player to the players array
    players.push(newPlayer)

}

// Player has changed option
function onChangePlayerOption (data) {
    // Find player in array
    var player = playerById(this.id)

    // Player not found
    if (!player) {
        util.log('Player not found: ' + this.id)
        return
    }

    // Update player option
    player.setOption(data.option)

    // Broadcast updated option to connected socket clients
    this.broadcast.emit('change player option', {id: player.id, option: player.getOption()})
}

/* ************************************************
 ** GAME HELPER FUNCTIONS
 ************************************************ */
// Find player by ID
function playerById (id) {
    var i
    for (i = 0; i < players.length; i++) {
        if (players[i].id === id) {
            return players[i]
        }
    }

    return false
}
var util = require('util')
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')
var io = require('socket.io')

var Player = require('./Player')

var port = process.env.PORT || 8080

var socket
var players
var playerCount
var challenges

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
    playerCount = 0
    challenges = []

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

    // Listen for new player message
    client.on('update player', onUpdatePlayer)

    // Listen for player message sent
    client.on('message sent', onMessageSent)

    // Listen for challenges
    client.on('challenge sent', onChallengeSent)

    // Listen for challenge response
    client.on('response sent', onResponseSent)

    // Listen for player option sent during a duel
    client.on('player option sent', onPlayerOptionSent)

    // Listen for player option sent during a duel
    client.on('player busy', onPlayerBusy)

    // Listen for player cancelling a challenge
    client.on('challenge canceled', onChallengeCanceled)
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
    newPlayer.setNumber(playerCount++)
    newPlayer.setName('Unnamed Player ' + newPlayer.getNumber())

    // Broadcast new player to connected socket clients
    this.broadcast.emit('new player', {id: newPlayer.id, name: newPlayer.getName()})

    // Send existing players to the new player
    var i, existingPlayer
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i]
        this.emit('new player', {id: existingPlayer.id, name: existingPlayer.getName()})
    }
    // Add new player to the players array
    players.push(newPlayer)

}

function onUpdatePlayer (data) {
    // Find player in array
    var player = playerById(this.id)

    // Player not found
    if (!player) {
        util.log('Player not found: ' + this.id)
        return
    }

    // Update player name
    player.setName(data.name)

    // Broadcast updated option to connected socket clients
    this.broadcast.emit('update player', {id: player.id, name: player.getName()})

}

function onMessageSent (data) {
    // Find player in array
    var player = playerById(this.id)

    // Player not found
    if (!player) {
        util.log('Player not found: ' + this.id)
        return
    }

    // Broadcast updated option to connected socket clients
    this.broadcast.emit('message sent', {name: player.getName(), message: data.message})

}

function onChallengeSent (data) {
    // Find player in array
    var player = playerById(this.id)

    // Player not found
    if (!player) {
        util.log('Player not found: ' + this.id)
        return
    }

    this.broadcast.to(data.challengedId).emit('challenge sent', {challengerId: this.id, name: player.getName()});
}

function onPlayerBusy (data) {

    this.broadcast.to(data.challengerId).emit('player busy', {});
}

function onResponseSent (data) {
    // Find player in array
    var player = playerById(this.id)

    // Player not found
    if (!player) {
        util.log('Player not found: ' + this.id)
        return
    }

    var date = new Date

    var challenge = {
        id: data.challengerId + this.id,
        createdAt : date,
        challengerId : data.challengerId,
        challengedId : this.id,
        challengerOption: '',
        challengedOption: ''
    }

    challenges.push(challenge)

    this.broadcast.to(data.challengerId).emit('response sent', {challengedId: this.id, response: data.response});
}

function onPlayerOptionSent (data) {
    // Find player in array
    var player = playerById(this.id)
    var challenge
    var opponentOption

    console.log(data)

    // Player not found
    if (!player) {
        util.log('Player not found: ' + this.id)
        return
    }

    if (data.state === 'challenger'){
        challenge = findChallengeById(this.id + data.opponentId)
        if (!challenge){
            util.log('Challenge ' + challengeId + ' Not found !')
            return
        }
        challenge.challengerOption = data.option
        opponentOption = challenge.challengedOption
    } else if (data.state === 'challenged'){
        challenge = findChallengeById(data.opponentId + this.id)
        if (!challenge){
            util.log('Challenge ' + challengeId + ' Not found !')
            return
        }
        challenge.challengedOption = data.option
        opponentOption = challenge.challengerOption
    } else {
        util.log('Illegal player state' + data.state)
        return
    }

    if (challenge.challengedOption !== '' && challenge.challengerOption  !== ''){

        var winnerId = winnerByChallenge(challenge)
        this.broadcast.to(data.opponentId).emit('challenge ended', { winnerId: winnerId, opponentOption: data.option });
        this.emit('challenge ended', { winnerId: winnerId, opponentOption: opponentOption });
        challenges.splice(challenges.indexOf(challenge), 1)
    }

    util.log(challenges)
}

function onChallengeCanceled (data) {

    console.log(data)

    this.broadcast.to(data.challengedId).emit('challenge canceled', {});

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

function findChallengeById (id) {
    var i
    for (i = 0; i < challenges.length; i++) {
        if (challenges[i].id === id) {
            return challenges[i]
        }
    }

    return false
}

function winnerByChallenge (challenge) {

    if (challenge.challengedOption === challenge.challengerOption){
        return 'null'
    }

    if (challenge.challengedOption === 'roche' && challenge.challengerOption === 'ciseau'){
        return challenge.challengedId
    }
    if (challenge.challengedOption === 'papier' && challenge.challengerOption === 'roche'){
        return challenge.challengedId
    }
    if (challenge.challengedOption === 'ciseau' && challenge.challengerOption === 'papier'){
        return challenge.challengedId
    }
    if (challenge.challengerOption === 'roche' && challenge.challengedOption === 'ciseau'){
        return challenge.challengerId
    }
    if (challenge.challengerOption === 'papier' && challenge.challengedOption === 'roche'){
        return challenge.challengerId
    }
    if (challenge.challengerOption === 'ciseau' && challenge.challengedOption === 'papier'){
        return challenge.challengerId
    }

}

function guid () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
/* global Phaser */

var game = new Phaser.Game(800, 400, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render })

function preload () {
    game.load.image('papier', 'assets/papier.png')
    game.load.image('roche', 'assets/roche.png')
    game.load.image('ciseau', 'assets/ciseau.png')
}

var socket
var player
var opponents
var cursors
var challengerId

function create () {

    opponents = []
    socket = io.connect()

    game.stage.backgroundColor = "#c9ffe1";

    // The base of our player
    player = game.add.sprite(160, 200, 'roche')
    player.scale.x = -0.5
    player.scale.y = 0.5
    player.anchor.setTo(0.5, 0.5)
    player.name = "Unnamed"

    player.bringToTop()

    cursors = game.input.keyboard.createCursorKeys()

    // Start listening for events
    setEventHandlers()
}

function update () {

    for (var i = 0; i < opponents.length; i++) {
        if (opponents[i].alive) {
            opponents[i].update()
        }
    }

    if (cursors.left.isDown) {
        player.option = 'roche'
        player.loadTexture('roche')
    } else if (cursors.down.isDown) {
        player.option = 'papier'
        player.loadTexture('papier')
    } else if (cursors.right.isDown) {
        player.option = 'ciseau'
        player.loadTexture('ciseau')
    }

    socket.emit('change player option', { option: player.option })
}

function render () {

}

var setEventHandlers = function () {
    // Socket connection successful
    socket.on('connect', onSocketConnected)

    // Socket disconnection
    socket.on('disconnect', onSocketDisconnect)

    // New player message received
    socket.on('new player', onNewPlayer)

    // New player message received
    socket.on('update player', onUpdatePlayer)

    // Player move message received
    socket.on('change player option', onChangePlayerOption)

    // Player removed message received
    socket.on('remove player', onRemovePlayer)

    // Listen for player message sent
    socket.on('message sent', onMessageSent)

    // Listen for player message sent
    socket.on('challenge sent', onChallengeSent)

    // Listen for player response sent
    socket.on('response sent', onResponseSent)
}

// Socket connected
function onSocketConnected () {
    console.log('Connected to socket server')

    opponents.forEach(function (opponent) {
        opponent.player.kill()
    })
    opponents = []
    document.getElementById('playerName').innerHTML = 'Unnamed'
    socket.emit('new player', { option: player.option })
}

// Socket disconnected
function onSocketDisconnect () {
    console.log('Disconnected from socket server')
}

// New player
function onNewPlayer (data) {
    console.log('New player connected:', data.id)

    // Avoid possible duplicate players
    var duplicate = playerById(data.id)
    if (duplicate) {
        console.log('Duplicate player!')
        return
    }

    // Add new player to the remote players array
    var list = document.getElementById("playersList")
    var entry = document.createElement('li')
    var att = document.createAttribute('id')
    att.value = data.id
    entry.setAttributeNode(att);
    entry.setAttribute('onclick', 'sendChallenge(this.id)')
    entry.setAttribute('class', 'players')
    entry.appendChild(document.createTextNode(data.name))
    list.appendChild(entry);
    opponents.push(new RemotePlayer(data.id, game, player))
}

// Move player
function onChangePlayerOption (data) {
    var updatePlayer = playerById(data.id)

    // Player not found
    if (!updatePlayer) {
        console.log('Player not found: ', data.id)
        return
    }

    // Update player position
    updatePlayer.player.option = data.option
}

// Remove player
function onRemovePlayer (data) {
    var removePlayer = playerById(data.id)

    // Player not found
    if (!removePlayer) {
        console.log('Player not found: ', data.id)
        return
    }

    removePlayer.player.kill()

    // Remove player from array
    var entry = document.getElementById(data.id)
    entry.parentNode.removeChild(entry);
    opponents.splice(opponents.indexOf(removePlayer), 1)
}

// Remove player
function onUpdatePlayer (data) {

    // Update player name
    document.getElementById(data.id).innerHTML = data.name
}

function onMessageSent (data) {
    var date = new Date;
    var chatBox = document.getElementById("chatBox")
    var entry = document.createElement('p')
    var att = document.createAttribute('style')
    att.value = "color: white;"
    entry.setAttributeNode(att);
    entry.setAttribute('id', 'entry')
    entry.appendChild(document.createTextNode('(' + date.toLocaleTimeString() + ') ' + data.name + ' : ' + data.message))
    chatBox.appendChild(entry);
    $('#chatBox').animate({"scrollTop": $('#chatBox')[0].scrollHeight}, "fast")
}

function onChallengeSent (data) {

    challengerId = data.challengerId
    $('#challenge').append('<p>You just received a challenge from ' + data.name + '</p>')
    $('#challenge').append('<input type="button" onclick="response(true)" value="Accept">')
    $('#challenge').append('<input type="button" onclick="response(false)" value="Refuse">')
}

function onResponseSent (data) {

    $('#challenge').empty()
    if(data.response){
        $('#challenge').append('<p> Challenge Accepted! </p>')

    } else {
        $('#challenge').append('<p> Challenge Refused! </p>')
    }

}

function response(response) {

    socket.emit('response sent', { challengerId: challengerId, response: response })
    $('#challenge').empty()
    if(response){
        $('#challenge').append('<p> Challenge Accepted! </p>')
    } else {
        $('#challenge').append('<p> Challenge Refused! </p>')
    }

}

function changeName(){

    var name = document.getElementById('name').value
    document.getElementById('name').value = ''

    if (name !== ''){
        document.getElementById('playerName').innerHTML = name
        player.name = name
        socket.emit('update player', { name: name })
    }
}

function messageSubmit(key){

    var message = document.getElementById('message').value

    if(event.keyCode == 13 && message !== '') {

        var date = new Date;
        document.getElementById('message').value = ''
        var chatBox = document.getElementById("chatBox")
        var entry = document.createElement('p')
        var att = document.createAttribute('style')
        att.value = "color: white;"
        entry.setAttributeNode(att);
        entry.setAttribute('id', 'entry')
        entry.appendChild(document.createTextNode('(' + date.toLocaleTimeString() + ') You : ' + message))
        chatBox.appendChild(entry);
        $('#chatBox').animate({"scrollTop": $('#chatBox')[0].scrollHeight}, "fast")
        socket.emit('message sent', { message: message })
    } else {
        socket.emit('player typing')
    }
}

function sendChallenge(id) {

    console.log('challenge sent!' + id)
    socket.emit('challenge sent', { challengedId: id })
    $("#challenge").append('<p>Awaiting response...</p>')
}

// Find player by ID
function playerById (id) {
    for (var i = 0; i < opponents.length; i++) {
        if (opponents[i].player.name === id) {
            return opponents[i]
        }
    }

    return false
}
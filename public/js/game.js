/* global Phaser */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render })

function preload () {
    game.load.image('papier', 'assets/papier.png')
    game.load.image('roche', 'assets/roche.png')
    game.load.image('ciseau', 'assets/ciseau.png')
}

var socket
var player
var opponents
var cursors

function create () {

    opponents = []
    socket = io.connect()

    // Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-500, -500, 1000, 1000)

    game.stage.backgroundColor = "#FFFFFF";

    // The base of our player
    player = game.add.sprite(10, 200, 'roche')
    player.scale.x = -0.5
    player.scale.y = 0.5
    player.anchor.setTo(0.5, 0.5)

    player.bringToTop()

    cursors = game.input.keyboard.createCursorKeys()

    // Start listening for events
    setEventHandlers()
}

var setEventHandlers = function () {
    // Socket connection successful
    socket.on('connect', onSocketConnected)

    // Socket disconnection
    socket.on('disconnect', onSocketDisconnect)

    // New player message received
    socket.on('new player', onNewPlayer)

    // Player move message received
    socket.on('change player option', onChangePlayerOption)

    // Player removed message received
    socket.on('remove player', onRemovePlayer)
}

// Socket connected
function onSocketConnected () {
    console.log('Connected to socket server')

    opponents.forEach(function (opponent) {
        opponent.player.kill()
    })
    opponents = []

    // Send local player data to the game server
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
    opponents.push(new RemotePlayer(data.id, game, player, data.option))
}

// Move player
function onChangePlayerOption (data) {
    var movePlayer = playerById(data.id)

    // Player not found
    if (!movePlayer) {
        console.log('Player not found: ', data.id)
        return
    }

    // Update player position
    movePlayer.player.option = data.option
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
    opponents.splice(opponents.indexOf(removePlayer), 1)
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

// Find player by ID
function playerById (id) {
    for (var i = 0; i < opponents.length; i++) {
        if (opponents[i].player.name === id) {
            return opponents[i]
        }
    }

    return false
}

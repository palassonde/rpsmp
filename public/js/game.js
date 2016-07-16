/* Global Phaser */

var game = new Phaser.Game(600, 400, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render })

function preload () {
    game.load.image('papier', 'assets/papier.png')
    game.load.image('roche', 'assets/roche.png')
    game.load.image('ciseau', 'assets/ciseau.png')
    game.load.image('envoyer', 'assets/envoyer.png')
}

var socket
var player
var opponents
var cursors
var challengerId
var inChallenge
var text
var opponent
var sentOption
var challengedId
var optionNumber
var sendButton

function create () {

    // Initialization
    opponents = []
    socket = io.connect()
    inChallenge = false
    sentOption = false
    optionNumber = 0
    sendButton = game.add.button(225, 600, 'envoyer', clickButton)

    game.stage.backgroundColor = '#ffa100';

    // Player's Hand
    player = game.add.sprite(160, 200, 'roche')
    player.scale.x = -0.5
    player.scale.y = 0.5
    player.anchor.setTo(0.5, 0.5)
    player.name = 'Sans nom'
    player.bringToTop()
    player.state = 'neutral'
    player.points = 0
    player.option = 'roche'
    $('#points').text(player.points)

    // Controls
    cursors = game.input.keyboard.createCursorKeys()
    player.inputEnabled = true;
    player.events.onInputDown.add(clickHand, this);

    // Start listening for events
    setEventHandlers()
}

function clickHand () {

    if (!sentOption){
        if (optionNumber == 0) {
            player.option = 'roche'
            player.loadTexture('roche')
        } else if (optionNumber == 1) {
            player.option = 'papier'
            player.loadTexture('papier')
        } else if (optionNumber == 2) {
            player.option = 'ciseau'
            player.loadTexture('ciseau')
        }
        optionNumber++
        if (optionNumber == 3){
            optionNumber = 0
        }
    }
}

function clickButton () {

    console.log('here')
    if (inChallenge && !sentOption){
        if (opponent.id){
            socket.emit('player option sent', { opponentId: opponent.id, option: player.option, state: player.state })
        } else {
            console.log('Opponent Id not set!')
        }
        sentOption = true
    }

}

function update () {

    if (!sentOption) {
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
    }

    if (inChallenge && cursors.up.isDown && !sentOption){
        if (opponent.id){
            socket.emit('player option sent', { opponentId: opponent.id, option: player.option, state: player.state })
        } else {
            console.log('Opponent Id not set!')
        }
        sentOption = true
    }
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

    // Player removed message received
    socket.on('remove player', onRemovePlayer)

    // Listen for player message sent
    socket.on('message sent', onMessageSent)

    // Listen for player message sent
    socket.on('challenge sent', onChallengeSent)

    // Listen for player response sent
    socket.on('response sent', onResponseSent)

    // Listen for player option sent
    socket.on('challenge ended', onChallengeEnded)

    socket.on('player busy', onPlayerBusy)

    socket.on('challenge canceled', onChallengeCanceled)
}

// Event Handlers //

// Socket connected
function onSocketConnected () {
    console.log('Connected to socket server')
    $('#playerName').text('Sans nom')
    socket.emit('new player', {})
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

    // Add player to visible list
    // var item = $('<li class="list-group-item"></li>')
    //
    // item.attr('id', data.id)
    // item.html(data.name)
    // item.attr('onclick', 'sendChallenge(this.id)')
    // $('#playerList').append(item)
    // console.log(item)
    var list = document.getElementById('playersList')
    var entry = document.createElement('li')
    var att = document.createAttribute('id')
    att.value = data.id
    entry.setAttributeNode(att);
    entry.setAttribute('onclick', 'sendChallenge(this.id, this.innerHTML)')
    entry.setAttribute('class', 'players list-group-item')
    entry.appendChild(document.createTextNode(data.name))
    list.appendChild(entry);

    // Add new player to the remote players array
    opponents.push(new RemotePlayer(data.id, game))
}

// Remove player
function onRemovePlayer (data) {
    var removePlayer = playerById(data.id)

    // Player not found
    if (!removePlayer) {
        console.log('Player not found: ', data.id)
        return
    }

    if (removePlayer.player){
        removePlayer.player.kill()
    }

    // Remove player from array
    var entry = document.getElementById(data.id)
    entry.parentNode.removeChild(entry);
    opponents.splice(opponents.indexOf(removePlayer), 1)
}

function onUpdatePlayer (data) {

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

    if (player.state === 'neutral'){
        challengerId = data.challengerId
        player.state = 'choosing'
        $('#challenge').empty()
        $('#challenge').append($('<div class="alert alert-info" role="alert"></div>').append(
            '<p>Vous avez reçu une invitation de ' + data.name + '</p>'+
            '<input type="button" onclick="respond(true)" value="Accepter">'+
            '<input type="button" onclick="respond(false)" value="Refuser">'
        ))

    } else {
        console.log('received challenge but busy!')
        socket.emit('player busy', { challengerId: data.challengerId })
    }

}

function onResponseSent (data) {

    $('#challenge').empty()
    if(data.response){
        $('#challenge').append('<p class="alert alert-success" role="alert"> Défi Accepté! </p>')
        opponent = playerById(data.challengedId)
        player.state = 'challenger'
        startChallenge()
    } else {
        player.state = 'neutral'
        $('#challenge').append('<p class="alert alert-danger" role="alert"> Défi Refusé! </p>')
    }

}

function onChallengeEnded (data) {

    console.log(data.opponentOption)

    opponent.player.loadTexture(data.opponentOption)

    console.log(opponent)

    if (data.winnerId === opponent.id){
        text = game.add.text(200, -100, 'Vous avez perdu!')
        game.add.tween(text).to( { y: 80 }, 500, Phaser.Easing.Linear.None, true);
    } else if(data.winnerId === 'null') {
        text = game.add.text(200, -100, 'Partie Null')
        game.add.tween(text).to( { y: 80 }, 500, Phaser.Easing.Linear.None, true);
    } else {
        text = game.add.text(200, -100, 'Vous avez gagné!')
        game.add.tween(text).to( { y: 80 }, 500, Phaser.Easing.Linear.None, true);
        player.points++
    }
    $('#points').text(player.points)
    setTimeout(cleanUp, 3000)
}

function onPlayerBusy (data) {

    player.state = 'neutral'
    challengedId = ''
    challengerId = ''
    $('#challenge').empty()
    $('#challenge').append('<p class="alert alert-warning" role="alert"> Le joueur est occupé ! </p>')
}

function onChallengeCanceled (data) {

    player.state = 'neutral'
    challengerId = ''
    $('#challenge').empty()

}

// Game related functions //

function startChallenge() {
    spawnOpponent()
    inChallenge = true
    game.add.tween(sendButton).to( { y: 330 }, 500, Phaser.Easing.Linear.None, true);

}

function spawnOpponent() {
    opponent.player = game.add.sprite(600, 100, 'roche')
    game.add.tween(opponent.player).to( { x: 280 }, 500, Phaser.Easing.Linear.None, true);
    opponent.player.scale.x = 0.5
    opponent.player.scale.y = 0.5
}

function respond(response) {

    socket.emit('response sent', { challengerId: challengerId, response: response })
    $('#challenge').empty()
    if(response){
        $('#challenge').append('<p class="alert alert-success" role="alert"> Défi Accepté! </p>')
        opponent = playerById(challengerId)
        player.state = 'challenged'
        startChallenge()
    } else {
        challengerId = ''
        player.state = 'neutral'
        $('#challenge').append('<p class="alert alert-danger" role="alert"> Défi Refusé! </p>')
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

    var message = $('#message').val()


    if((key === 'button' || event.keyCode == 13) && message !== '') {

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

function sendChallenge(id, name) {

    if (player.state === 'neutral'){
        challengedId = id
        socket.emit('challenge sent', { challengedId: id })
        player.state = 'waiting'
        $('#challenge').empty()
        $('#challenge').append($('<div class="alert alert-info" role="alert"></div>').append(
            '<p>En attente de la réponse de '+ name + '...</p>'+
            '<input type="button" onclick="cancelChallenge()" value="Canceller">'
        ))
    } else {
        console.log('you are busy!')
    }
}

function cancelChallenge () {
    player.state = 'neutral'
    $('#challenge').empty()
    socket.emit('challenge canceled', { challengedId: challengedId})
    challengedId = ''
}

function cleanUp () {

    game.add.tween(text).to( { y: -100 }, 500, Phaser.Easing.Linear.None, true);
    game.add.tween(opponent.player).to( { x: 600 }, 500, Phaser.Easing.Linear.None, true);
    opponent = null
    inChallenge = false
    player.state = 'neutral'
    challengerId = ''
    sentOption = false
    game.add.tween(sendButton).to( { y: 600 }, 500, Phaser.Easing.Linear.None, true);
    $("#challenge").empty()
}

// Helpers //

function playerById (id) {
    for (var i = 0; i < opponents.length; i++) {
        if (opponents[i].id === id) {
            return opponents[i]
        }
    }

    return false
}
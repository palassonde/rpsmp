/* global game */

var RemotePlayer = function (index, game, player) {

    this.game = game
    this.player = player
    this.alive = true
    // this.player.option = option
    this.player = game.add.sprite(480, 100, 'roche')
    this.player.scale.x = 0.5
    this.player.scale.y = 0.5

    this.player.name = index.toString()
}

RemotePlayer.prototype.update = function () {

    // this.player.loadTexture(this.player.option)
}

window.RemotePlayer = RemotePlayer

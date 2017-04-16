/* global game */

var RemotePlayer = function (id, game) {

    this.option = 'roche'
    this.id = id
    this.game = game
    this.alive = true
}

RemotePlayer.prototype.update = function () {

    // this.player.loadTexture(this.player.option)
}

window.RemotePlayer = RemotePlayer

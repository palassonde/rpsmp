var Player = function () {

    var id
    var option

    var setOption = function (newOption) {
        option = newOption
    }

    var getOption = function () {
        return option
    }

    return {
        getOption: getOption,
        setOption: setOption,
        id: id
    }
}

module.exports = Player

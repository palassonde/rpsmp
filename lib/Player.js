var Player = function () {

    var id
    var option
    var name

    var setOption = function (newOption) {
        option = newOption
    }

    var getOption = function () {
        return option
    }

    var setName = function (newName) {
        name = newName
    }

    var getName = function () {
        return name
    }

    return {
        getOption: getOption,
        setOption: setOption,
        getName: getName,
        setName: setName,
        id: id
    }
}

module.exports = Player

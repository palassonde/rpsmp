var Player = function () {

    var id
    var option
    var name
    var number

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

    var setNumber = function (newNumber) {
        number = newNumber
    }

    var getNumber = function () {
        return number
    }

    return {
        getOption: getOption,
        setOption: setOption,
        getName: getName,
        setName: setName,
        getNumber: getNumber,
        setNumber: setNumber,
        id: id
    }
}

module.exports = Player

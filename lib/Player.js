var Player = function () {

    var id
    var option
    var name
    var number
    var score

    var setOption = function (newOption) {
        option = newOption
    }

    var getOption = function () {
        return option
    }

    var setScore = function (newScore) {
        score = newScore
    }

    var getScore = function () {
        return score
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
        getScore: getScore,
        setScore: setScore,
        getName: getName,
        setName: setName,
        getNumber: getNumber,
        setNumber: setNumber,
        id: id
    }
}

module.exports = Player

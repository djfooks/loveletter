
function PlayerInfoTemplate()
{
    this.playerInfoTemplate = document.getElementById("playerInfoTemplate");
    this.playerInfoDivs = [];

    this.animationDivs = [];

    this.playerNameSpan = [];
    var template = this.playerInfoTemplate.innerHTML + '';
    var i;
    for (i = 0; i < 4; i += 1)
    {
        this.playerInfoDivs[i] = document.getElementById("playerInfo" + i);
        this.playerInfoDivs[i].innerHTML = template.replace(/#/g, i);

        this.playerNameSpan[i] = document.getElementById("player" + i + "Name");
    }

    var playerStates = [];
    for (i = 0; i < 4; i += 1)
    {
        playerStates[i] = new PlayerState(i);
    }

    playerStates[0].roundsWon = 4;
    playerStates[0].lastAction = "PLAYED";
    playerStates[0].lastCard = 4;
    playerStates[0].lastTarget = 3;
    playerStates[0].lastGuess = "BARON";

    playerStates[1].roundsWon = 1;
    playerStates[1].lastAction = "DISCARD";
    playerStates[1].lastCard = 12;
    playerStates[1].lastTarget = -1;
    playerStates[1].lastGuess = "";

    playerStates[2].roundsWon = 3;
    playerStates[2].lastAction = "PLAYED";
    playerStates[2].lastCard = 10;
    playerStates[2].lastTarget = 2;
    playerStates[2].lastGuess = "";

    for (i = 0; i < 4; i += 1)
    {
        this.updatePlayerState(null, i, playerStates[i]);
    }
}

PlayerInfoTemplate.prototype.setPlayerNames = function (app)
{
    var i;
    for (i = 0; i < app.players.length; i += 1)
    {
        this.playerNameSpan[i].innerHTML = app.players[i];
        Helpers.setHidden(this.playerInfoDivs[i], false);
    }
    /*for (; i < 4; i += 1)
    {
        Helpers.setHidden(this.playerInfoDivs[i], true);
    }*/
};

PlayerInfoTemplate.prototype.update = function (deltaTime, turn, target)
{
};

PlayerInfoTemplate.prototype.updatePlayerState = function (app, playerIndex, playerState)
{
    var div = this.playerInfoDivs[playerIndex];

    var rows = 2;
    if (playerState.lastTarget !== -1)
        rows = 3;

    var row3 = document.getElementById("player" + playerIndex + "Row3");
    if (rows >= 3)
    {
        row3.className = "row3 fullRow center";
    }
    else
    {
        row3.className = "hidden";
    }

    var i;
    for (i = 0; i < 4; i += 1)
    {
        var gem = document.getElementById("player" + playerIndex + "Gem" + i);
        Helpers.setHidden(gem, i >= playerState.roundsWon);
    }

    var playerAction = document.getElementById("player" + playerIndex + "Action");
    var playerPlayedSpan = document.getElementById("player" + playerIndex + "PlayedSpan");
    if (playerState.lastAction == "PLAYED")
    {
        Helpers.setHidden(playerPlayedSpan, false);
        playerAction.innerHTML = "Played ";

    }
    else if (playerState.lastAction == "DISCARD")
    {
        Helpers.setHidden(playerPlayedSpan, false);
        playerAction.innerHTML = "Discarded ";
    }
    else
    {
        Helpers.setHidden(playerPlayedSpan, true);
    }

    if (playerState.lastCard !== -1)
    {
        var playerPlayedCardSpan = document.getElementById("player" + playerIndex + "PlayedCardSpan");
        var cardTypeStr = cardTypes[playerState.lastCard];
        Helpers.setCard(playerPlayedCardSpan, cardTypeStr);
    }

    if (playerState.lastTarget !== -1)
    {
        var playerTarget = document.getElementById("player" + playerIndex + "Target");
        playerTarget.innerHTML = "Bob";//app.getTargetName(playerState.lastTarget);
    }

    var playerGuess = document.getElementById("player" + playerIndex + "Guess");
    if (playerState.lastGuess === "")
    {
        Helpers.setHidden(playerGuess, true);
    }
    else
    {
        Helpers.setCard(playerGuess, playerState.lastGuess);
        Helpers.setHidden(playerGuess, false);
    }
};


var App = function ()
{
    window.onerror = this.onError.bind(this);
    this.debugText = "";

    var i;

    this.fullscreenDiv = document.getElementById("fullscreenDiv");

    this.responseText = document.getElementById("responseText");
    this.responseText.value = "";

    this.roomSpan = document.getElementById("roomSpan");
    this.playersText = document.getElementById("playersText");

    this.msgText = document.getElementById("msgText");
    this.msgReadButton = document.getElementById("msgReadButton");

    this.startButton = document.getElementById("startButton");

    this.toggleHelpButton = document.getElementById("toggleHelpButton");
    this.gameDiv = document.getElementById("gameDiv");
    this.cardsHelpDiv = document.getElementById("cardsHelpDiv");
    this.mainDiv = document.getElementById("mainDiv");
    this.joinGameDiv = document.getElementById("joinGameDiv");
    this.disconnectDiv = document.getElementById("disconnectDiv");
    this.debugDiv = document.getElementById("debugDiv");
    this.cardsDiv = document.getElementById("cardsDiv");
    this.pickPlayerDiv = document.getElementById("pickPlayerDiv");
    this.guessCardDiv = document.getElementById("guessCardDiv");
    this.msgDiv = document.getElementById("msgDiv");
    this.playingDivs = [ this.cardsDiv, this.pickPlayerDiv, this.guessCardDiv ];

    this.handText = [];
    this.handText.push(document.getElementById("card0Text"));
    this.handText.push(document.getElementById("card1Text"));

    this.playButtons = [];
    this.playButtons.push(document.getElementById("card0Button"));
    this.playButtons.push(document.getElementById("card1Button"));

    this.pickupDiv = document.getElementById("pickupDiv");

    this.playerButtons = [];
    for (i = 0; i < 4; i += 1)
    {
        this.playerButtons.push(document.getElementById("pickPlayer" + i + "Button"));
    }

    this.guessButtons = [];
    for (i = 1; i < 8; i += 1) // ignore GUARD
    {
        this.guessButtons.push(document.getElementById("guess" + i + "Button"));
        this.guessButtons[i - 1].innerHTML = cardDetailsMap[orderedCards[i]].name;
    }

    this.cardHelpTexts = [];
    for (i = 0; i < 8; i += 1)
    {
        this.cardHelpTexts.push(document.getElementById("cardHelp" + i + "Text"));
    }

    this.cardHelpDiv = [];
    for (i = 0; i < 8; i += 1)
    {
        this.cardHelpDiv.push(document.getElementById("cardHelpDiv" + i));
    }

    this.localStorage = window.localStorage;

    this.key = this.localStorage.getItem('key');
    if (!this.key)
    {
        this.key = Math.floor(Math.random() * 9999999);
        this.localStorage.setItem('key', this.key);
    }

    this.roomCodeInput = document.getElementById("roomCodeInput");
    var roomCode = this.localStorage.getItem('room');
    if (roomCode)
    {
        this.roomCodeInput.value = roomCode;
    }

    var name = this.localStorage.getItem('name');
    this.nameInput = document.getElementById("nameInput");
    if (name)
    {
        this.nameInput.value = name;
    }

    this.websocket = null;

    this.resetGame();

    if (name && roomCode)
    {
        this.connect();
    }
    else
    {
        this.setVisualState("JOIN_ROOM");
    }

    this.updateCardHelp();
    this.showingCardHelp = false;

    HelpTemplate.update(this);
};

App.prototype.toggleView = function ()
{
    this.showingCardHelp = !this.showingCardHelp;
    if (this.showingCardHelp)
    {
        this.cardsHelpDiv.style.display = "block";
        this.mainDiv.style.display = "none";
        this.toggleHelpButton.innerHTML = "Back";
    }
    else
    {
        this.cardsHelpDiv.style.display = "none";
        this.mainDiv.style.display = "block";
        this.toggleHelpButton.innerHTML = "Cards Descriptions";
    }
};

App.prototype.getCardPlayedCount = function (cardStr)
{
    var i;
    var j;
    var total = 0;
    for (i = 0; i < this.playerStates.length; i += 1)
    {
        var played = this.playerStates[i].played;
        for (j = 0; j < played.length; j += 1)
        {
            if (cardTypes[played[j]] == cardStr)
                total += 1;
        }
    }
    return total;
};

App.prototype.updateCardHelp = function ()
{
    var i;
    var j;
    var padding = 50;
    for (i = 0; i < 8; i += 1)
    {
        var details = cardDetailsMap[orderedCards[i]];
        var played = this.getCardPlayedCount(details.cardType);
        var topLineText = details.name + " (" + details.value + ")";
        for (; topLineText.length < padding;)
        {
            topLineText += " ";
        }

        for (j = 0; j < details.numInDeck; j += 1)
        {
            topLineText += (j < played) ? "I" : "-";
        }
        topLineText += "\n";
        this.cardHelpTexts[i].value = topLineText + details.shortAction;
    }
}

App.prototype.resetGame = function ()
{
    this.hand = [];
    this.players= [];
    this.playerStates = [];
    this.playerId = -1;
    this.turnId = -1;
    this.resetTurnState();
};

App.prototype.resetTurnState = function ()
{
    this.playingCardId = -1;
    this.playingCard = -1;
    this.playingCardStr = '';
    this.pickedPlayer = -1;
    this.interaction = {};
    this.msgReadCmd = '';
}

App.prototype.show = function (div)
{
    var i;
    for (i = 0; i < this.playingDivs.length; i += 1)
    {
        var element = this.playingDivs[i];
        var show = element == div;
        if (div.length && div.indexOf(element) !== -1)
            show = true;

        if (show)
        {
            element.style.display = "block";
        }
        else
        {
            element.style.display = "none";
        }
    }
};

App.prototype.createRoom = function ()
{
    var that = this;
    var xhr = new XMLHttpRequest();
    function reqListener ()
    {
        try
        {
            var data = JSON.parse(xhr.response);
            that.roomCode = data.room;
            that.roomCodeInput.value = that.roomCode;
        }
        catch (e)
        {
        }
    }

    xhr.onload = reqListener;
    xhr.open("GET", 'https://bzlzgmgcuh.execute-api.eu-west-2.amazonaws.com/default/loveletter-create');
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send();
};

App.prototype.getRoomCode = function ()
{
    return this.roomCodeInput.value.toUpperCase();
};

App.prototype.connect = function ()
{
    this.localStorage.setItem('name', this.nameInput.value);
    this.localStorage.setItem('room', this.getRoomCode());
    this.websocket = new WebSocket("wss://u72xrovjcj.execute-api.eu-west-2.amazonaws.com/test?room=" + this.getRoomCode() + "&key=" + this.key + "&name=" + this.nameInput.value);

    var that = this;
    this.websocket.onopen = function (event) {
        that.onopen();
    };
    this.websocket.onmessage = function (event) {
        that.onmessage(event.data);
    };
};

App.prototype.setVisualState = function (state)
{
    this.joinGameDiv.style.display = (state === "JOIN_ROOM") ? "block" : "none";
    this.gameDiv.style.display = (state === "CONNECTED") ? "block" : "none";
};

App.prototype.disconnect = function ()
{
    this.websocket.close();
    this.responseText.value = "Websocket disconnected";

    this.localStorage.removeItem('room');
    this.resetGame();
    this.setVisualState("JOIN_ROOM");
};

App.prototype.onopen = function ()
{
    this.roomSpan.innerHTML = this.getRoomCode();
    this.responseText.value = "Websocket connected...";
    this.send({ "cmd": "GET" });
    this.setVisualState("CONNECTED");
};

App.prototype.start = function ()
{
    this.send({ "cmd": "START" });
    this.startButton.style.display = "none";
};

App.prototype.restart = function ()
{
    this.send({ "cmd": "RESTART" });
    this.startButton.style.display = "none";
};

App.prototype.forceRoundEnd = function ()
{
    this.send({ "cmd": "FORCE_ROUND_END" });
};

App.prototype.onmessage = function (strData)
{
    this.responseText.value += "\n" + strData;
    var data = JSON.parse(strData);
    switch(data.cmd) {
        case "START_CARD":
        {
            this.playerId = data.playerId;
            this.addCard(data.pickup);
        }
        break;
        case "PICKUP":
        case "YOUR_TURN":
        {
            // clear your SAFE state
            this.playerStates[this.playerId]["state"] = "ALIVE";
            this.addCard(data.pickup);
            this.updatePlayersText();
            this.updatePlayButtons();
        }
        break;
        case "JOINED":
        {
            this.players[data.index] = data.name;
            this.updatePlayersText();
        }
        break;
        case "START_GAME":
        {
            this.setMsg("");
            this.responseText.value = strData;
            this.gotFullState(data);
        }
        break;
        case "STATE":
        case "PLAYED":
        case "ROUND_COMPLETE":
        case "NEXT_ROUND":
        {
            this.gotFullState(data);
        }
        break;
        case "END_TURN":
        {
            this.endTurn();
            this.gotFullState(data);
        }
        break;
        case "REVEALED":
        {
            this.interaction.state = "CONTINUE";
            this.reveal();
            this.updateInteraction();
        }
        break;
        case "NEXT_TURN":
        {
            this.nextTurn(data);
        }
        break;
        case "DISCARD":
        {
            this.discard(data);
        }
        break;
        case "ROUND_COMPLETE":
        {
            this.turnId = data.turn;
            this.playerStates = data.playerStates;
            this.updateInteraction();
        }
        break;
    }
};

App.prototype.gotFullState = function (data)
{
    if (data.playerId !== undefined)
        this.playerId = data.playerId;
    this.players = data.players;
    if (data.gamestate == "LOGIN")
    {
        this.show([]);
        if (this.playerId == 0)
            this.startButton.style.display = "block";
    }
    else if (data.gamestate == "PLAYING")
    {
        this.hand = data.hand || [];
        this.turnId = data.turn;
        this.playerStates = data.playerStates;
        this.updateHandText();

        this.interaction = data.interaction;
        this.updateInteraction();
    }
    this.updatePlayersText();
    this.updatePlayButtons();
    this.updateCardHelp();
}

App.prototype.discard = function (data)
{
    var playerState = this.playerStates[data.playerId];
    if (data.playerId == this.playerId)
    {
        var i;
        for (i = 0; i < this.hand.length; i += 1)
        {
            if (data.card == this.hand[i])
            {
                playerState.played.push(data.card);
                this.hand.splice(i, 1);
                this.updateHandText();
            }
        }
    }
    else
    {
        playerState.played.push(data.card);
    }
    this.updateCardHelp();
};

App.prototype.nextTurn = function (data)
{
    this.turnId = data.turn;
    this.show(this.cardsDiv);
    this.interaction = {};
    this.updateInteraction();
    this.updatePlayersText();
};

App.prototype.send = function (jsonData)
{
    jsonData["room"] = this.getRoomCode();
    this.websocket.send(JSON.stringify(jsonData));
};

App.prototype.addCard = function (card)
{
    var i;
    for (i = 0; i < this.hand.length; i += 1)
    {
        if (card == this.hand[i])
        {
            return;
        }
    }
    this.hand.push(card);
    this.updateHandText();
};

App.prototype.updateHandText = function ()
{
    var card;
    var details;
    var i;
    if (!this.hand)
    {
        for (i = 0; i < 2; i += 1)
        {
            this.handText[i].value = "";
        }
        return;
    }

    for (i = 0; i < this.hand.length; i += 1)
    {
        card = this.hand[i];
        details = cardDetailsMap[cardTypes[card]];
        this.handText[i].value = getCardName(card) + "\n" + details.shortAction;
    }

    if (this.hand.length == 2)
    {
        this.pickupDiv.style.display = "block";
    }
    else
    {
        this.pickupDiv.style.display = "none";
    }
};

App.prototype.roundComplete = function ()
{
    this.show([]);
    var i;
    var j;
    var roundWinners = this.interaction.roundWinners;
    this.updatePlayersText();
    var msgText = "";
    if (roundWinners.length == 1)
    {
        msgText += this.players[roundWinners[0]] + " wins the round!\n";
    }
    else
    {
        for (i = 0; i < roundWinners.length; i += 1)
            msgText += (i == 0 ? "" : ", ") + this.players[roundWinners[i]]
        msgText += " tied for the win!\n";
    }

    var longestName = 12;
    for (i = 0; i < this.players.length; i += 1)
    {
        longestName = Math.max(longestName, this.players[i].length);
    }

    for (i = 0; i < this.playerStates.length; i += 1)
    {
        msgText += this.players[i];
        for (j = this.players[i].length; j < longestName + 4; j += 1)
        {
            msgText += " ";
        }
        if (this.playerStates[i].state !== "DEAD")
        {
            if (this.interaction.finalCards.length > 0)
            {
                msgText += getCardName(this.interaction.finalCards[i]);
            }
            else
            {
                msgText += "ROUND WINNER!";
            }
        }
        else
        {
            msgText += "ELIMINATED";
        }
        msgText += "\n";
    }
    if (this.interaction.hiddenCard !== null)
        msgText += "Hidden card was " + getCardName(this.interaction.hiddenCard);

    this.setMsg(msgText, (this.turnId == this.playerId && this.interaction.gameWinner === undefined) ? "START NEW ROUND" : null)
};

App.prototype.updatePlayersText = function ()
{
    var roundWinners = this.interaction.roundWinners;
    if (!roundWinners)
        roundWinners = [];

    var i;
    var j;
    var longestName = 12;
    var wins;
    var winner = -1;
    var highestRoundsWon = 0;
    var gotPlayerStates = this.playerStates && this.playerStates.length == this.players.length;
    for (i = 0; i < this.players.length; i += 1)
    {
        longestName = Math.max(longestName, this.players[i].length);
        if (gotPlayerStates)
        {
            wins = this.playerStates[i].wins;
            if (wins >= tokensToWinMap[this.players.length])
            {
                if (wins > highestRoundsWon)
                {
                    winner = i;
                    highestRoundsWon = wins;
                }
                else if (wins == highestRoundsWon)
                {
                    winner = -1;
                }
            }
        }
    }

    var playersMsg = "";
    var first = true;
    for (i = 0; i < this.players.length; i += 1)
    {
        if (!first)
        {
            playersMsg += "\n";
        }
        playersMsg += this.players[i];
        for (j = this.players[i].length; j < longestName + 4; j += 1)
        {
            playersMsg += " ";
        }
        if (gotPlayerStates)
        {
            if (winner === i)
            {
                playersMsg += "GAME WINNER!  ";
            }
            else if (roundWinners.indexOf(i) !== -1)
            {
                playersMsg += "ROUND WINNER! ";
            }
            else if (winner === -1 && this.turnId == i)
            {
                playersMsg += "TURN...       ";
            }
            else if (this.playerStates[i].state === "DEAD")
            {
                playersMsg += "ELIMINATED    ";
            }
            else if (this.playerStates[i].state === "SAFE")
            {
                playersMsg += "SAFE          ";
            }
            else
            {
                playersMsg += "              ";
            }

            for (j = 0; j < this.playerStates[i].wins; j += 1)
            {
                playersMsg += "I";
            }
        }
        first = false;
    }

    this.playersText.value = playersMsg;
    this.updatePlayersButtons();
};

App.prototype.updatePlayersButtons = function ()
{
    var i;
    if (!this.anyValidTargets() && (this.playingCardStr != "PRINCE"))
    {
        this.playerButtons[0].innerHTML = "No Valid Target";
        this.playerButtons[0].style.display = "block";
        for (i = 1; i < 4; i += 1)
        {
            this.playerButtons[i].style.display = "none";
        }
        return;
    }

    for (i = 0; i < 4; i += 1)
    {
        var show = i < this.players.length;

        if (i == this.playerId && this.playingCardStr != "PRINCE")
            show = false;

        if (show && this.playerStates[i] && this.playerStates[i]["state"] != "ALIVE")
            show = false;

        if (show)
        {
            this.playerButtons[i].innerHTML = this.players[i];
            this.playerButtons[i].style.display = "block";
        }
        else
        {
            this.playerButtons[i].style.display = "none";
        }
    }
};

App.prototype.updatePlayButtons = function (forceDisable)
{
    var showButtons = !forceDisable && this.turnId == this.playerId && !this.interaction.state;
    this.playButtons[0].style.display = showButtons ? "inline" : "none";
    this.playButtons[1].style.display = showButtons ? "inline" : "none";
};

App.prototype.playCard = function (cardId)
{
    var card = this.hand[cardId];
    if (card === undefined)
        return;
    var otherCard = this.hand[cardId == 0 ? 1 : 0];
    var cardStr = cardTypes[card];

    this.playingCardId = cardId;
    this.playingCard = card;
    this.playingCardStr = cardStr;

    if (cardTypes[otherCard] == "COUNTESS" && (cardStr == "KING" || cardStr == "PRINCE"))
    {
        var turnName = this.players[this.turnId];
        this.setMsg("TURN:           " + turnName + "...\nMUST PLAY COUNTESS WITH A KING OR PRINCE!");
        return;
    }

    switch(cardStr) {
        case "GUARD":
        case "PRIEST":
        case "BARON":
        case "PRINCE":
        case "KING":
        {
            this.updatePlayersButtons();
            this.show(this.pickPlayerDiv);
            return;
        }
        break;
    }

    this.sendPlayCard(cardId);
};

App.prototype.pickPlayer = function (pickedId)
{
    if (pickedId == -1) // back
    {
        this.resetTurnState();
        this.show(this.cardsDiv);
        return;
    }

    if (this.playingCardStr == "GUARD" && this.anyValidTargets())
    {
        this.pickedPlayer = pickedId;
        this.show(this.guessCardDiv);
    }
    else
    {
        this.sendPlayCard(this.playingCardId, pickedId);
    }
};

App.prototype.guess = function (guessCardIndex)
{
    if (guessCardIndex == -1) // back
    {
        this.updatePlayersButtons();
        this.show(this.pickPlayerDiv);
        return;
    }

    var cardStr = orderedCards[guessCardIndex];
    this.sendPlayCard(this.playingCardId, this.pickedPlayer, cardStr);
    this.updatePlayButtons(true);
};

App.prototype.sendPlayCard = function (cardId, target, guess)
{
    var cmd;
    if (cardId == 0)
        cmd = "PLAY_HAND";
    else if (cardId == 1)
        cmd = "PLAY_PICKUP";
    var msg = { "room": this.getRoomCode(), "cmd": cmd };
    if (target != undefined)
        msg["target"] = target;
    if (guess != undefined)
        msg["guess"] = guess;
    this.send(msg);
    this.resetTurnState();

    this.hand.splice(cardId, 1);
    this.updateHandText();
    this.show(this.cardsDiv);
};

App.prototype.getOtherCard = function ()
{
    var i;
    for (i = 0; i < 2; i += 1)
    {
        if (this.hand[i] !== this.interaction.card)
            return this.hand[i];
    }
    return this.hand[0];
};

App.prototype.anyValidTargets = function ()
{
    var i;
    for (i = 0; i < this.playerStates.length; i += 1)
    {
        if (i != this.turnId && this.playerStates[i].state == "ALIVE")
        {
            return true;
        }
    }
    return false;
};

App.prototype.reveal = function ()
{
    var i;
    var j;
    var myTurn = this.playerId == this.turnId;
    var target = this.interaction.target;
    var isTarget = this.playerId == target;
    var cardStr = cardTypes[this.interaction.card];
    if (cardStr == "KING" && this.interaction.swappedFor !== undefined)
    {
        this.hand[0] = this.interaction.swappedFor;
        this.updateHandText();
    }
};

App.prototype.endTurn = function ()
{
    // waiting for turn to end...
};

App.prototype.updateInteraction = function ()
{
    if (this.interaction.state == "ROUND_COMPLETE")
    {
        this.roundComplete();
        return;
    }
    this.show(this.cardsDiv);

    var myTurn = this.playerId == this.turnId;
    var turnName = this.players[this.turnId];
    var target = this.interaction.target;
    if (this.interaction.card === undefined)
    {
        this.setMsg("TURN:           " + turnName + (myTurn ? "..." : ""));
        return;
    }

    var isTarget = this.playerId == target;
    var guess = this.interaction.guess;
    var cardStr = cardTypes[this.interaction.card];
    var result = this.interaction.result;

    var targetName = this.players[target];

    var stateIsReveal = this.interaction.state == "REVEAL";
    var stateIsContinue = this.interaction.state == "CONTINUE";

    var buttonText;
    var showButton = (myTurn && stateIsContinue) || (isTarget && stateIsReveal);
    if (myTurn)
        buttonText = "END TURN..."

    var msgText            = "TURN:           " + turnName + (stateIsContinue ? "..." : "") + "\n";
    msgText               += "PLAYED:         " + getCardName(this.interaction.card)  + "\n";

    if (!this.anyValidTargets() && (cardStr == "GUARD" ||
                                    cardStr == "PRIEST" ||
                                    cardStr == "BARON" ||
                                    cardStr == "KING"))
    {
        msgText       += "NO VALID TARGET";
        this.setMsg(msgText, showButton ? buttonText : null);
        return;
    }

    if (target !== undefined)
    {
        msgText           += "TARGET:         " + targetName + (stateIsReveal ? "..." : "") + "\n";
    }

    switch(cardStr) {
        case "GUARD":
        {
            // Player designates another player and names a type of card.
            // If that player's hand matches the type of card specified, that player is eliminated from the round.
            // However, Guard cannot be named as the type of card.
            var guessName = cardDetailsMap[guess].name;
            var guessCorrect = result == "CORRECT_GUESS";
            msgText       += "GUESS:          " + guessName + "\n";
            if (stateIsContinue)
                msgText   += "RESULT:         " + "Guess " + (guessCorrect ? "CORRECT" : "INCORRECT") + "\n";
            if (stateIsReveal && isTarget)
                buttonText = "RESPOND " + (guessCorrect ? "(Oh no they guessed correctly!)" : "(Ha they guessed wrong!)");
        }
        break;

        case "PRIEST":
        {
            // Player is allowed to see another player's hand.
            if (isTarget)
                buttonText = "REVEAL CARD";

            if (myTurn && stateIsContinue)
            {
                msgText   += "REVEALED CARD:  " + getCardName(this.interaction.revealedCard) + "\n";
            }
        }
        break;

        case "BARON":
        {
            // Player will choose another player and privately compare hands.
            // The player with the lower-strength hand is eliminated from the round.
            if (isTarget)
                buttonText = "COMPARE CARDS";

            if (stateIsContinue)
            {
                if (myTurn || isTarget)
                {
                    msgText   += "YOUR CARD:      " + getCardName(this.getOtherCard()) + "\n";
                    msgText   += "TARGET CARD:    " + getCardName(this.interaction.revealedCard) + "\n";
                }
                if (this.interaction.result == "TIE")
                {
                    msgText   += "RESULT:         TIE\n";
                }
                else if (myTurn || isTarget)
                {
                    var isLoser = this.playerId == this.interaction.loser;
                    msgText   += "RESULT:         " + (isLoser ? "You lose" : "You win");
                }
                else
                {
                    msgText   += "LOSER:          " + this.players[this.interaction.loser] + "\n";
                    msgText   += "LOSING CARD:    " + getCardName(this.interaction.discard);
                }
            }
        }
        break;

        case "PRINCE":
        {
            // Player can choose any player (including themselves) to discard their hand and draw a new one.
            // If the discarded card is the Princess, the discarding player is eliminated.
            if (stateIsContinue)
            {
                msgText   += "DISCARDED CARD: " + getCardName(this.interaction.revealedCard);
            }
            else if (isTarget)
            {
                buttonText = "DISCARD CARD";
            }
        }
        break;

        case "KING":
        {
            // Player trades hands with any other player.
            if (isTarget)
                buttonText = "SWAP CARDS";

            if (myTurn || isTarget)
            {
                if (stateIsContinue)
                {
                    msgText   += "OLD CARD:       " + getCardName(myTurn ? this.interaction.otherCard : this.interaction.prevCard);
                }
                else
                {
                    msgText   += "YOUR CARD:      " + getCardName(myTurn ? this.interaction.otherCard : this.interaction.prevCard);
                }
            }
        }
        break;
    }

    this.setMsg(msgText, showButton ? buttonText : null);
};

App.prototype.setMsg = function (msgText, buttonText)
{
    this.msgText.value = msgText;
    if (buttonText)
    {
        this.msgReadButton.innerHTML = buttonText;
        this.msgReadButton.style.display = "inline";
    }
    else
    {
        this.msgReadButton.style.display = "none";
    }
    this.show(this.cardsDiv);
};

App.prototype.msgRead = function ()
{
    this.send({"cmd": this.interaction.state});
    this.msgReadCmd = '';
    this.msgReadButton.style.display = "none";
};

App.prototype.debugInfo = function debugInfo(str)
{
    this.debugMsg += str + "<br>";
    document.getElementById("debugText").innerHTML = this.debugMsg;
};

App.prototype.onError = function onError(message, source, lineno, colno, error)
{
    this.debugInfo("Error: " + source + ":" + lineno + " " + message);
};

var app = new App();

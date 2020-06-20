var cardTypes = [];

var cardDetailsMap = {
    "GUARD":    { "value": 1, "name": "Guard",
        "shortAction": "Guess another players card (you cannot guess \"Guard\").",
        "action": "Pick another player and guess their card type (you cannot guess \"Guard\"). If correct, the other player is eliminated." },
    "PRIEST":   { "value": 2, "name": "Priest",
        "shortAction": "Pick another player to privately see their hand.",
        "action": "Pick another player to privately see their hand." },
    "BARON":    { "value": 3, "name": "Baron",
        "shortAction": "Pick another player and compare hands. Lowest value is eliminated.",
        "action": "Pick another player and privately compare hands. The player with the lower-strength hand is eliminated." },
    "HANDMAID": { "value": 4, "name": "Handmaid",
        "shortAction": "You cannot be targeted until your next turn.",
        "action": "You cannot be targeted until your next turn." },
    "PRINCE":   { "value": 5, "name": "Prince",
        "shortAction": "Pick any player to discard their hand and draw a new one.",
        "action": "Pick any player (including youself) to discard their hand and draw a new one. If they discard the Princess they are eliminated." },
    "KING":     { "value": 6, "name": "King",
        "shortAction": "Pick another player and trade hands with them.",
        "action": "Pick another player and trade hands with them." },
    "COUNTESS": { "value": 7, "name": "Countess",
        "shortAction": "Must be played if your other card is a King or Prince.",
        "action": "If your other card is a King or Prince card, this card must be played." },
    "PRINCESS": { "value": 8, "name": "Princess",
        "shortAction": "If you play this card for any reason, you are eliminated.",
        "action": "If you play this card for any reason, you are eliminated from the round." },
};

var orderedCards = ["GUARD", "PRIEST", "BARON", "HANDMAID", "PRINCE", "KING", "COUNTESS", "PRINCESS"];

function init()
{
    function addCardTypes(cardStr, count)
    {
        var i;
        for (i = 0; i < count; i += 1)
        {
            cardTypes.push(cardStr);
        }
    }

    addCardTypes('GUARD', 5);
    addCardTypes('PRIEST', 2);
    addCardTypes('BARON', 2);
    addCardTypes('HANDMAID', 2);
    addCardTypes('PRINCE', 2);
    addCardTypes('KING', 1);
    addCardTypes('COUNTESS', 1);
    addCardTypes('PRINCESS', 1);
}
init();

function getCardName(card)
{
    return cardDetailsMap[cardTypes[card]].name + " (" + cardDetailsMap[cardTypes[card]].value + ")";
}

var App = function ()
{
    var i;

    this.responseText = document.getElementById("responseText");
    this.responseText.value = "";

    this.playersSpan = document.getElementById("playersSpan");

    this.msgText = document.getElementById("msgText");
    this.msgReadButton = document.getElementById("msgReadButton");

    this.cardsDiv = document.getElementById("cardsDiv");
    this.pickPlayerDiv = document.getElementById("pickPlayerDiv");
    this.guessCardDiv = document.getElementById("guessCardDiv");
    this.msgDiv = document.getElementById("msgDiv");
    this.divs = [ this.cardsDiv, this.pickPlayerDiv, this.guessCardDiv ];

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
};

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
    this.interaction = null;
    this.msgReadCmd = '';
}

App.prototype.show = function (div)
{
    var i;
    for (i = 0; i < this.divs.length; i += 1)
    {
        var element = this.divs[i];
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

App.prototype.connect = function ()
{
    this.localStorage.setItem('name', this.nameInput.value);
    this.localStorage.setItem('room', this.roomCodeInput.value);
    this.websocket = new WebSocket("wss://u72xrovjcj.execute-api.eu-west-2.amazonaws.com/test?room=" + this.roomCodeInput.value + "&key=" + this.key + "&name=" + this.nameInput.value);

    var that = this;
    this.websocket.onopen = function (event) {
        that.onopen();
    };
    this.websocket.onmessage = function (event) {
        that.onmessage(event.data);
    };
};

App.prototype.disconnect = function ()
{
    this.websocket.close();
    this.responseText.value = "Websocket disconnected";
    this.resetGame();
};

App.prototype.onopen = function ()
{
    this.responseText.value = "Websocket connected...";
    this.send({ "cmd": "GET" });
};

App.prototype.start = function ()
{
    this.send({ "cmd": "RESTART" });
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
            this.addCard(data.pickup);
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
            this.responseText.value = strData;
        } // fall-through
        case "STATE":
        case "PLAYED":
        {
            if (data.playerId !== undefined)
                this.playerId = data.playerId;
            this.players = data.players;
            this.updatePlayersText();
            if (data.gamestate == "LOGIN")
            {
                this.show([]);
            }
            else if (data.gamestate == "PLAYING")
            {
                this.show(this.cardsDiv);
                this.hand = data.hand || [];
                this.turnId = data.turn;
                this.playerStates = data.playerStates;
                this.updateHandText();

                this.interaction = data.interaction;
                this.updateInteraction();
            }
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
    }
};

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
};

App.prototype.nextTurn = function (data)
{
    this.turnId = data.turn;
    this.show(this.cardsDiv);
    this.interaction = {};
    this.updateInteraction();
};

App.prototype.send = function (jsonData)
{
    jsonData["room"] = this.roomCodeInput.value;
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

App.prototype.updatePlayersText = function ()
{
    this.playersSpan.innerHTML = this.players.join(", ");
    this.updatePlayersButtons();
};

App.prototype.updatePlayersButtons = function ()
{
    if (!this.anyValidTargets() && (this.playingCardStr != "PRINCE"))
    {
        this.playerButtons[0].innerHTML = "No Valid Target";
        this.playerButtons[0].style.display = "block";
        return;
    }

    var i;
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
};

App.prototype.sendPlayCard = function (cardId, target, guess)
{
    var cmd;
    if (cardId == 0)
        cmd = "PLAY_HAND";
    else if (cardId == 1)
        cmd = "PLAY_PICKUP";
    var msg = { "room": this.roomCodeInput.value, "cmd": cmd };
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

App.prototype.updateInteraction = function ()
{
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
                    msgText   += "REVEALED CARD:  " + getCardName(this.interaction.revealedCard) + "\n";
                }
                if (this.interaction.result == "TIE")
                {
                    msgText   += "RESULT:         TIE";
                }
                else if (myTurn || isTarget)
                {
                    var isLoser = this.playerId == this.interaction.loser;
                    msgText   += "RESULT:         " + (isLoser ? "LOSER" : "WINNER");
                }
                else
                {
                    msgText   += "LOSER:          " + this.players[this.interaction.loser];
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
        this.msgReadButton.style.display = "block";
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

var app = new App();
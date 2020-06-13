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
    return cardDetailsMap[cardTypes[card]].name;
}

var App = function ()
{
    var i;

    this.responseText = document.getElementById("responseText");
    this.responseText.value = "";

    this.playersSpan = document.getElementById("playersSpan");

    this.msgSpan = document.getElementById("msgSpan");
    this.msgReadButton = document.getElementById("msgReadButton");

    this.cardsDiv = document.getElementById("cardsDiv");
    this.pickPlayerDiv = document.getElementById("pickPlayerDiv");
    this.guessCardDiv = document.getElementById("guessCardDiv");
    this.msgDiv = document.getElementById("msgDiv");
    this.divs = [ this.cardsDiv, this.pickPlayerDiv, this.guessCardDiv, this.msgDiv ];

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
        case "STATE":
        case "START_GAME":
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
                if (data.interaction)
                {
                    this.updateInteraction();
                }
            }
        }
        break;
        case "PLAYED":
        {
            var cardStr = cardTypes[data.card];

            if (data.target !== undefined)
            {
                this.interaction = data;
                this.updateInteraction();
            }
        }
        break;
        case "REVEAL":
        case "CONTINUE":
        {
            this.interaction.state = data.cmd;
            this.updateInteraction();
        }
        break;
        case "NEXT_TURN":
        {
            this.turnId = data.turn;
            this.show(this.cardsDiv);
        }
        break;
    }
};

App.prototype.send = function (jsonData)
{
    jsonData["room"] = this.roomCodeInput.value;
    this.websocket.send(JSON.stringify(jsonData));
};

App.prototype.addCard = function (card)
{
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
        this.handText[i].value = details.name + " (" + details.value + ")\n" + details.shortAction;
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
    var i;
    for (i = 0; i < 4; i += 1)
    {
        var show = i < this.players.length;

        if (i == this.playerId && this.playingCardStr != "PRINCE")
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
    var cardStr = cardTypes[card];

    this.playingCardId = cardId;
    this.playingCard = card;
    this.playingCardStr = cardStr;

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

    if (this.playingCardStr == "GUARD")
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

    var cardStr = orderedCards[guessCardIndex - 1]; // ignore GUARD
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

App.prototype.updateInteraction = function ()
{
    var myTurn = this.playerId == this.turnId;
    var target = this.interaction.target;
    var isTarget = this.playerId == target;
    var guess = this.interaction.guess;
    var cardStr = cardTypes[this.interaction.card];
    var result = this.interaction.result;

    var turnName = this.players[this.turnId];
    var targetName = this.players[target];

    var revealedCardStr = this.interaction.revealedCard ? getCardName(this.interaction.revealedCard) : "";

    switch(cardStr) {
        case "GUARD":
        {
            // Player designates another player and names a type of card.
            // If that player's hand matches the type of card specified, that player is eliminated from the round.
            // However, Guard cannot be named as the type of card.

            var guessName = cardDetailsMap[guess].name;
            var guessCorrect = result == "CORRECT_GUESS";
            if (this.interaction.state == "REVEAL")
            {
                if (isTarget)
                {
                    this.setMsg(turnName + " is guessing your card is a " + guessName + " " +
                        (guessCorrect ? "(oh no they're right!)" : "(ha they guessed wrong!)") + "...", 'Respond');
                }
                else if (myTurn)
                {
                    this.setMsg("You guessed that " + targetName + " has a " + guessName + ". Waiting for " + targetName + "...");
                }
                else
                {
                    this.setMsg(turnName + " played a Guard and guessed that " + targetName + " has a " + guessName + ". Waiting for " + targetName + "...");
                }
            }
            else if (this.interaction.state == "CONTINUE")
            {
                if (isTarget)
                {
                    this.setMsg(turnName + " " + (guessCorrect ? "correctly" : "incorrectly") +
                        " guessed that you have a " + guessName + "." + (guessCorrect ? " You are eliminated!" : ""));
                }
                else if (myTurn)
                {
                    this.setMsg("You " + (guessCorrect ? "correctly" : "incorrectly") +
                        " guessed that " + targetName + " has a " + guessName + ".", 'End Turn');
                }
                else
                {
                    this.setMsg(turnName + " played a Guard and " + (guessCorrect ? "correctly" : "incorrectly") +
                        " guessed that " + targetName + " has a " + guessName + ". Waiting for " + turnName + "...");
                }
            }
        }
        break;

        case "PRIEST":
        {
            // Player is allowed to see another player's hand.

            if (this.interaction.state == "REVEAL")
            {
                if (isTarget)
                {
                    this.setMsg(turnName + " played a Priest and targeted you! You must reveal your " + getCardName(this.hand[0]) + " to them...", 'Reveal');
                }
                else if (myTurn)
                {
                    this.setMsg("You played a Priest. Waiting for " + targetName + " to reveal their card...");
                }
                else
                {
                    this.setMsg(turnName + " played a Priest and targeted " + targetName);
                }
            }
            else if (this.interaction.state == "CONTINUE")
            {
                if (isTarget)
                {
                    this.setMsg(turnName + " played a Priest and targeted you! You have revealed your " + getCardName(this.hand[0]) + " to them...");
                }
                else if (myTurn)
                {
                    this.setMsg("You played a Priest. " + targetName + " has a " + getCardName(revealedCard), "End Turn");
                }
                else
                {
                    this.setMsg(turnName + " played a Priest and targeted " + targetName ". Waiting for " + turnName);
                }
            }
        }
        break;

        case "BARON":
        {
            // Player will choose another player and privately compare hands.
            // The player with the lower-strength hand is eliminated from the round.

            if (this.interaction.state == "REVEAL")
            {
                if (isTarget)
                {
                    this.setMsg(turnName + " challenged you with a Baron. Your " + getCardName(this.hand[0]) + " for their card...", 'Compare Cards');
                }
                else if (myTurn)
                {
                    this.setMsg("You challenged " targetName + " with your Baron. Waiting for " + targetName + " to reveal their card...");
                }
                else
                {
                    this.setMsg(turnName + " played a Baron and has challenged " + targetName + ".");
                }
            }
            else if (this.interaction.state == "CONTINUE")
            {
                if (isTarget)
                {
                    this.setMsg(turnName + " played a Priest and targeted you! You have revealed your " + getCardName(this.hand[0]) + " to them...");
                }
                else if (myTurn)
                {
                    this.setMsg("You played a Priest. " + targetName + " has a " + getCardName(revealedCard), "End Turn");
                }
                else
                {
                    this.setMsg(turnName + " played a Priest and targeted " + targetName ". Waiting for " + turnName);
                }
            }

            var revealedCard = this.interaction.revealedCard || this.interaction.discard;
            if (revealedCard == undefined)
            {
                if (isTarget)
                {
                    this.msgReadCmd = "REVEAL";
                    this.setMsg(turnName + ": Challenged you with a Baron. Your " + getCardName(this.hand[0]) + " for their card...", 'Compare Cards');
                }
                else
                {
                    this.setMsg(turnName + ": Played a Baron and has challenged " + targetName + ".");
                }
            }
            else
            {
                if (myTurn || isTarget)
                {
                    if (myTurn)
                        this.msgReadCmd = "CONTINUE";

                    if (result == "TIE")
                    {
                        this.setMsg("You both have a " + getCardName(revealedCard) + ". It's a tie! Both players keep thier cards.", myTurn ? 'End turn' : undefined);
                    }
                    else
                    {
                        if (this.playerId == this.interaction.loser)
                        {
                            this.setMsg(this.players[this.playerId == target ? this.turnId : target] + " has a " + getCardName(revealedCard) + ". You lose!", myTurn ? 'End turn' : undefined);
                            this.playerStates[this.playerId].state = "DEAD";
                        }
                        else
                        {
                            this.setMsg(this.players[this.playerId == target ? this.turnId : target] + " has a " + getCardName(revealedCard) + ". You win!", myTurn ? 'End turn' : undefined);
                        }
                    }
                }
                else
                {
                    if (result == "TIE")
                    {
                        this.setMsg(turnName + ": Played a Baron and challenged " + targetName + ". It's a tie! Both players keep thier cards.");
                    }
                    else
                    {
                        this.setMsg(turnName + ": Played a Baron and challenged " + targetName + ". " + this.players[this.interaction.loser] + " lost!");
                    }
                }
            }
        }
        break;
        case "PRINCE":
        {
            var revealedCard = this.interaction.revealedCard;
            if (revealedCard == undefined)
            {
                if (isTarget)
                {
                    this.msgReadCmd = "REVEAL";
                    this.setMsg(turnName + ": Used a Prince to swap your " + getCardName(this.hand[0]) + " for ...", 'Swap Cards');
                }
                else
                {
                    this.setMsg("Waiting for " + targetName);
                }
            }
            else
            {
                if (myTurn)
                {
                    this.msgReadCmd = "CONTINUE";
                    this.setMsg("Swapped your " + getCardName(this.hand[this.playingCardId == 0 ? 1 : 0]) + " for " + getCardName(revealedCard), 'End Turn');
                    this.hand[this.playingCardId == 0 ? 1 : 0] = revealedCard;
                    this.updateHandText();
                }
                else if (isTarget)
                {
                    this.setMsg(turnName + ": Used a Prince to swap your " + getCardName(this.hand[0]) + " for a " + getCardName(revealedCard));
                    this.hand[0] = revealedCard;
                    this.updateHandText();
                }
                else
                {
                    this.setMsg("Waiting for " + turnName);
                }
            }
        }
        break;
    }
};

App.prototype.setMsg = function (msgText, buttonText)
{
    this.msgSpan.innerHTML = msgText;
    if (buttonText)
    {
        this.msgReadButton.innerHTML = buttonText;
        this.msgReadButton.style.display = "block";
    }
    else
    {
        this.msgReadButton.style.display = "none";
    }
    this.show([this.cardsDiv, this.msgDiv]);
};

App.prototype.msgRead = function ()
{
    this.send({"cmd": this.interaction.state});
    this.msgReadCmd = '';
    this.msgReadButton.style.display = "none";
};

var app = new App();

var cardTypes = [];

var cardDetailsMap = {
    "GUARD":    { "value": 1, "name": "Guard",    "action": "Pick another player and guess their card type (you cannot guess \"Guard\"). If correct, the other player is eliminated." },
    "PRIEST":   { "value": 2, "name": "Priest",   "action": "Pick another player to privately see their hand." },
    "BARON":    { "value": 3, "name": "Baron",    "action": "Pick another player and privately compare hands. The player with the lower-strength hand is eliminated." },
    "HANDMAID": { "value": 4, "name": "Handmaid", "action": "You cannot be targeted until your next turn." },
    "PRINCE":   { "value": 5, "name": "Prince",   "action": "Pick any player (including youself) to discard their hand and draw a new one. If they discard the Princess they are eliminated." },
    "KING":     { "value": 6, "name": "King",     "action": "Pick another player and trade hands with them." },
    "COUNTESS": { "value": 7, "name": "Countess", "action": "If your other card is a King or Prince card, this card must be played." },
    "PRINCESS": { "value": 8, "name": "Princess", "action": "If you play this card for any reason, you are eliminated from the round." },
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

    this.playerButtons = [];
    for (i = 0; i < 4; i += 1)
    {
        this.playerButtons.push(document.getElementById("pickPlayer" + i + "Button"));
    }

    this.guessButtons = [];
    for (i = 0; i < 8; i += 1)
    {
        this.guessButtons.push(document.getElementById("guess" + i + "Button"));
        this.guessButtons[i].innerHTML = cardDetailsMap[orderedCards[i]].name;
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

    this.hand = [];
    this.players= [];
    this.playerId = -1;
    this.turnId = -1;
    this.resetTurnState();

    if (name && roomCode)
    {
        this.connect();
    }
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
        if (this.divs[i] == div)
        {
            div.style.display = "block";
        }
        else
        {
            this.divs[i].style.display = "none";
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
            this.addCard(data.pickup);
        }
        break;
        case "YOUR_TURN":
        {
            this.addCard(data.pickup);
        }
        break;
        case "STATE":
        {
            this.hand = data.hand;
            this.players = data.players;
            this.playerId = data.playerId;
            this.turnId = data.turn;
            this.updateHandText();
            this.updatePlayersText();

            this.interaction = data.interaction;
            if (data.interaction)
            {
                this.updateInteraction();
            }
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
    for (i = 0; i < this.hand.length; i += 1)
    {
        card = this.hand[i];
        details = cardDetailsMap[cardTypes[card]];
        this.handText[i].value = details.name + " (" + details.value + ")\n" + details.action;
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
    if (!card)
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
    switch(cardTypes[this.interaction.card]) {
        case "PRINCE":
        {
            var revealedCard = this.interaction.revealedCard;
            if (revealedCard == undefined)
            {
                if (isTarget)
                {
                    this.msgReadCmd = "REVEAL";
                    this.setMsg(this.players[this.turnId] + ": Used a Prince to swap your " + getCardName(this.hand[0]) + " for their card...", 'Swap Cards');
                }
                else
                {
                    this.setMsg("Waiting for " + this.players[target]);
                }
            }
            else
            {
                if (myTurn)
                {
                    this.msgReadCmd = "CONTINUE";
                    this.setMsg("Swapped your " + getCardName(this.hand[this.playingCardId == 0 ? 1 : 0]) + " for " + getCardName(revealedCard), 'Continue');
                }
                else if (isTarget)
                {
                    this.setMsg(this.players[this.turnId] + ": Used a Prince to swap your " + getCardName(this.hand[0]) + " for a " + getCardName(revealedCard));
                }
                else
                {
                    this.setMsg("Waiting for " + this.players[this.turnId]);
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
    this.show(this.msgDiv);
};

App.prototype.msgRead = function ()
{
    this.send({"cmd": this.msgReadCmd});
    this.msgReadCmd = '';
};

var app = new App();

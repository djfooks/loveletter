
var App = function ()
{
    this.loadedPages = {};

    var that = this;
    document.addEventListener('init', function(event) {
            if (event.target.matches('#help')) {
                that.loadedPages.help = true;
                that.setupHelp();
            }
            if (event.target.matches('#game')) {
                that.loadedPages.game = true;
                that.setupGame();
            }
            if (event.target.matches('#interaction')) {
                that.loadedPages.interaction = true;
                that.setupInteraction();
            }
            if (event.target.matches('#roundend')) {
                that.loadedPages.roundend = true;
                that.setupRoundEnd();
            }
            if (event.target.matches('#pickcharacter')) {
                that.loadedPages.pickcharacter = true;
                that.setupPickCharacter();
            }
            if (event.target.matches('#login')) {
                that.loadedPages.login = true;
                that.setupLogin();
            }
        }, false);

    document.addEventListener('prechange', ({ target, tabItem }) => {
            if (target.matches('#tabbar'))
            {
                document.querySelector('#game-toolbar .center').innerHTML = tabItem.getAttribute('label');
            }
        });

    this.pickedCharacterId = null;
    this.selectedCharacterId = null;
    this.playerId = null;
    this.numPlayers = 0;
    this.ui = {
        playerDetails: []
    };

    /*
    this.playerDetails =  [
        {
            "name": "DaveyGravey",
            "tokens": [4, 5],
            "discarded": ["GUARD", "PRINCE", "BARON"],
            "character": 0,
            "state": "ALIVE"
        },
        {
            "name": "Jojo",
            "tokens": [1, 7, 8],
            "discarded": ["PRIEST", "KING", "BARON"],
            "character": 5,
            "state": "ALIVE"
        },
        {
            "name": "Bob",
            "tokens": [1, 7, 8],
            "discarded": ["PRINCESS"],
            "character": 10,
            "state": "DEAD"
        },
        {
            "name": "Harry",
            "tokens": [1, 7, 8],
            "discarded": [],
            "character": 26,
            "state": "SAFE"
        }
    ];
    */

    this.localStorage = window.localStorage;

    this.key = this.localStorage.getItem('key');
    if (!this.key)
    {
        this.key = Math.floor(Math.random() * 9999999);
        this.localStorage.setItem('key', this.key);
    }
    this.name = this.localStorage.getItem('name');
    this.roomCode = this.localStorage.getItem('room');

    this.websocket = null;

    this.resetGame();

    if (name && roomCode)
    {
        this.connect();
    }
};

App.prototype.openMenu = function ()
{
    document.querySelector('#menu').open();
}

App.prototype.loadPage = function (page)
{
    document.querySelector('#menu').close();
    document.querySelector('#navigator').bringPageTop(page, { animation: 'fade' });
}

App.prototype.joinRoom = function ()
{
    document.getElementById('joinRoomButton').disabled = true;
    this.connect();
};

App.prototype.toGame = function ()
{
    this.loadPage('game.html');
};

App.prototype.toHelp = function ()
{
    this.loadPage('help.html');
};

App.prototype.setupLogin = function ()
{
    document.getElementById('joinRoomButton').disabled = false;

    this.roomCodeInput = document.getElementById("roomCodeInput");
    if (this.roomCode)
    {
        this.roomCodeInput.value = this.roomCode;
    }

    this.nameInput = document.getElementById("nameInput");
    if (this.name)
    {
        this.nameInput.value = this.name;
    }
}

App.prototype.setupGame = function ()
{
    if (!this.loadedPages.game)
    {
        return;
    }

    var data = {};

    data.tokenList = [];
    var i;
    for (i = 0; i < 30; i += 1)
    {
        data.tokenList[i] = {
            "color": "red",
            "rotation": 5
        };
    }

    data.playerDetails = app.ui.playerDetails;

    data.cards = ["GUARD"];

    data.cardPlayState = {"state": "GUESS", "target": 1 };

    data.remainingCards = [1, 2, 3, 4, 5, 6, 7, 1];

    ReactDOM.render(
        GameCarouselItems(data),
        document.getElementById('gameReact')
    );

    ReactDOM.render(
        GameTopBar(data),
        document.getElementById('gameTopBarReact')
    );

    this.gameCarousel = document.getElementById('gameCarousel');
};

App.prototype.gamePrev = function ()
{
    this.gameCarousel.prev();
};

App.prototype.gameNext = function ()
{
    this.gameCarousel.next();
};

App.prototype.setupHelp = function ()
{
    var data = {};
    data.remainingCards = [1, 2, 3, 4, 5, 6, 7, 1];

    ReactDOM.render(
        getHelpElement(data),
        document.getElementById('helpReact')
    );

    this.helpCarousel = document.getElementById('helpCarousel');
};

App.prototype.helpPrev = function ()
{
    this.helpCarousel.prev();
};

App.prototype.helpNext = function ()
{
    this.helpCarousel.next();
};

App.prototype.setupInteraction = function ()
{
    var data = {};

    data.playerDetails = this.playerDetails;
    data.playerId = 1;
    data.playerTurn = 0;
    data.playerTarget = 1;
    data.playedCard = "PRINCE";
    data.otherCard = "KING";
    data.guessed = "PRINCE";
    data.interactionStatus = "CONTINUE";
    data.result = "LOSE";
    data.revealedCard = "GUARD";
    data.loser = 0;
    data.discard = "GUARD";

    ReactDOM.render(
        InteractionPageContent(data),
        document.getElementById('interactionReact')
    );
};

App.prototype.setupRoundEnd = function ()
{
    var data = {};

    data.playerDetails = this.playerDetails;
    data.winnerIds = [1, 2];
    data.finalCards = ["PRIEST", "KING", "PRIEST", "GUARD"];
    data.hiddenCard = "BARON";

    ReactDOM.render(
        RoundEndPageContent(data),
        document.getElementById('roundendReact')
    );
};

App.prototype.getAlreadyPickedCharacterIds = function ()
{
    var alreadyPickedIds = [];

    var i;
    var playerDetails;
    for (i = 0; i < this.ui.playerDetails.length; i += 1)
    {
        playerDetails = this.ui.playerDetails[i];
        if (playerDetails.characterId != undefined && playerDetails.characterId != this.pickedCharacterId)
            alreadyPickedIds.push(playerDetails.characterId);
    }
    return alreadyPickedIds;
};

App.prototype.setupPickCharacter = function ()
{
    var data = {};

    data.playerDetails = this.ui.playerDetails;
    data.pickedCharacterId = this.pickedCharacterId;
    data.selectedCharacterId = this.selectedCharacterId;
    data.alreadyPickedIds = this.getAlreadyPickedCharacterIds();

    ReactDOM.render(
        PickCharacterPageContent(data),
        document.getElementById('pickcharacterReact')
    );
    this.updatePickCharacterButton();
};

App.prototype.selectCharacter = function (id)
{
    this.selectedCharacterId = id;
    this.setupPickCharacter();
};

App.prototype.updatePickCharacterButton = function ()
{
    var alreadyPickedIds = this.getAlreadyPickedCharacterIds();
    document.getElementById("pickCharacterButton").disabled = this.selectedCharacterId != null && alreadyPickedIds.indexOf(this.selectedCharacterId) != -1;
}

App.prototype.pickCharacter = function ()
{
    this.send({ "cmd": "PICK_CHARACTER", "characterId": this.selectedCharacterId });
    document.getElementById("pickCharacterButton").disabled = true;
}

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
}

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

App.prototype.disconnect = function ()
{
    this.websocket.close();
    this.localStorage.removeItem('room');
    this.resetGame();
};

App.prototype.onopen = function ()
{
    this.send({ "cmd": "GET" });
    this.loadPage("pickcharacter.html");
};

App.prototype.start = function ()
{
    this.send({ "cmd": "START" });
};

App.prototype.restart = function ()
{
    this.send({ "cmd": "RESTART" });
};

App.prototype.forceRoundEnd = function ()
{
    this.send({ "cmd": "FORCE_ROUND_END" });
};

App.prototype.onmessage = function (strData)
{
    var data = JSON.parse(strData);
    switch(data.cmd) {
        case "CHARACTER_ID_IN_USE":
        {
            this.updatePickCharacterButton();
        }
        break;
        case "CHARACTER_PICKED":
        {
            this.ui.playerDetails[data.playerId].characterId = data.characterId;
            if (data.playerId == this.playerId)
            {
                this.pickedCharacterId = data.characterId;
                this.loadPage("game.html");
            }
            else
            {
                this.setupPickCharacter();
                this.setupGame();
            }
        }
        break;
        case "START_CARD":
        {
            /*this.playerId = data.playerId;
            this.addCard(data.pickup);*/
        }
        break;
        case "PICKUP":
        case "YOUR_TURN":
        {
            // clear your SAFE state
            /*this.playerStates[this.playerId]["state"] = "ALIVE";
            this.addCard(data.pickup);*/
            // TODO update gui
        }
        break;
        case "JOINED":
        {
            this.ui.playerDetails[data.index] = {
                name: data.name,
                characterId: data.characterId,
                tokens: [],
                state: "ALIVE",
                discarded: []
            };
            // TODO update gui
        }
        break;
        case "START_GAME":
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
    this.numPlayers = data.players.length;

    if (data.gamestate == "LOGIN")
    {
        // TODO update gui
        this.ui.playerDetails = [];
        var i;
        for (i = 0; i < data.players.length; i += 1)
        {
            var player = data.players[i];
            this.ui.playerDetails.push({
                name: player.name,
                characterId: player.characterId,
                tokens: [],
                state: "ALIVE",
                discarded: []
            });
        }
        this.pickedCharacterId = data.players[this.playerId].characterId;
        this.selectedCharacterId = this.pickedCharacterId;
        this.setupPickCharacter();
    }
    else if (data.gamestate == "PLAYING")
    {
        this.hand = data.hand || [];
        this.turnId = data.turn;
        this.playerStates = data.playerStates;
        this.interaction = data.interaction;
        // TODO update gui
    }
    // TODO update gui
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
                // TODO update gui
            }
        }
    }
    else
    {
        playerState.played.push(data.card);
    }
    // TODO update gui
};

App.prototype.nextTurn = function (data)
{
    this.turnId = data.turn;
    this.interaction = {};
    // TODO update gui
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
    // TODO update gui
};

App.prototype.roundComplete = function ()
{
};

App.prototype.playCard = function (cardId)
{
    // TODO update cardPlayState
    this.sendPlayCard(cardId);
};

App.prototype.pickPlayer = function (pickedId)
{
    if (pickedId == -1) // back
    {
        this.resetTurnState();
        return;
    }

    if (this.playingCardStr == "GUARD" && this.anyValidTargets())
    {
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

    var msg = { "room": this.getRoomCode(), "cmd": cmd };
    if (target != undefined)
        msg["target"] = target;
    if (guess != undefined)
        msg["guess"] = guess;
    this.send(msg);
    this.resetTurnState();

    this.hand.splice(cardId, 1);
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
};

App.prototype.updateInteraction = function ()
{
    if (this.interaction.state == "ROUND_COMPLETE")
    {
        this.roundComplete();
        return;
    }
};

var app = new App();

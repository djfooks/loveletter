import { CardType, orderedCards } from "./cards";
import { GameState, PlayerDetails } from "./Shared";
import { EventHandler, LVListenerList, LVUIProperty } from "./UIListeners";

class ClientApp
{
    pickedCharacterId : number;
    selectedCharacterId : number;
    playerId : number;
    numPlayers : number;
    key: number | null;
    username: string;
    roomcode: string;
    websocket: WebSocket | null;
    playerDetails: PlayerDetails[];
    gameState: GameState;
    listenerId: number;

    prevUIData: any;

    hand : CardType[];
    turnId : number;

    uiEventHandler : EventHandler;

    constructor()
    {
        this.uiEventHandler = new EventHandler();

        this.pickedCharacterId = -1;
        this.selectedCharacterId = -1;
        this.playerId = -1;
        this.numPlayers = 0;
        this.hand = ["GUARD", "PRINCE"];
        this.turnId = -1;
        this.playerDetails = [];
        this.gameState = "LOGIN";
        this.listenerId = 0;
        
        var localStorage = window.localStorage;

        this.key = localStorage.getItem('key') as number | null;
        if (!this.key)
        {
            this.key = Math.floor(Math.random() * 9999999);
            localStorage.setItem('key', String(this.key));
        }
        this.username = localStorage.getItem('name') || "";
        this.roomcode = localStorage.getItem('room') || "";

        this.websocket = null;

        this.prevUIData = {};
        
        var that = this;
        that.playerDetails = [{
            characterId: 3,
            discarded: [],
            name: "Dave",
            state: "ALIVE",
            tokens: []
        }];

        setTimeout(function () {
            that.playerDetails = [{
                characterId: 5,
                discarded: [],
                name: "Dave",
                state: "ALIVE",
                tokens: [{gem: 5}]
            },
            {
                characterId: 7,
                discarded: [],
                name: "Jojo",
                state: "ALIVE",
                tokens: [{gem: 5}, {gem: 5}, {gem: 5}]
            }];

            that.updateUI();
        }, 3000);
    }

    effectListeners(listeners : LVListenerList)
    {
        this.uiEventHandler.register(listeners);
        var that = this;
        return function ()
        {
            that.uiEventHandler.clean(listeners);
        };
    }

    buildUIValues(p : LVUIProperty | null) : any
    {
        var uiValues : any = {};
        function addProperty(prop : LVUIProperty, cb : any)
        {
            if (p === null || prop === p)
            {
                uiValues[prop] = cb();
            }
        }

        addProperty("playerDetails", () => this.playerDetails);
        addProperty("hand", () => this.hand);
        addProperty("discardedCardTotals", () => this.getCardDiscardedCountArray());
        addProperty("playerId", () => this.playerId);
        addProperty("gameState", () => this.gameState);
        addProperty("username", () => this.username);
        addProperty("roomcode", () => this.roomcode);
        return uiValues;
    }

    updateUI()
    {
        var nextUIValue : any = this.buildUIValues(null);

        var p : string;
        for (p in this.uiEventHandler.properties)
        {
            var valueStr = JSON.stringify(nextUIValue[p]);
            if (valueStr !== this.prevUIData[p])
            {
                this.uiEventHandler.propertyChange(p as LVUIProperty, nextUIValue[p]);
                this.prevUIData[p] = valueStr;
            }
        }
    }

    getUiProperty(p : LVUIProperty)
    {
        return this.buildUIValues(p)[p];
    }

    resetGame()
    {
        this.hand = [];
        this.turnId = -1;
    }

    joinRoom(name : string, roomcode : string)
    {
        this.username = name;
        this.roomcode = roomcode.toUpperCase();

        var localStorage = window.localStorage;
        localStorage.setItem('name', name);
        localStorage.setItem('room', this.roomcode);
        this.websocket = new WebSocket("wss://u72xrovjcj.execute-api.eu-west-2.amazonaws.com/test?room=" + this.roomcode + "&key=" + this.key + "&name=" + this.username);

        var that = this;
        this.websocket.onopen = function (/*event*/) {
            that.onopen();
        };
        this.websocket.onmessage = function (event) {
            that.onmessage(event.data);
        };
        this.websocket.onclose = function (/*event*/) {
            that.uiEventHandler.triggerEvent("leaveRoom");
        };
        this.websocket.onerror = function (/*event*/) {
            that.uiEventHandler.triggerEvent("connectionError", that.roomcode + "");
            that.roomcode = "";
            that.updateUI();
        };
    }

    onopen()
    {
        this.uiEventHandler.triggerEvent("joinRoom");
    }

    onmessage(message : any)
    {
    }

    createRoom()
    {
        var that = this;
        var xhr = new XMLHttpRequest();
        function reqListener ()
        {
            try
            {
                var data = JSON.parse(xhr.response);
                that.roomcode = data.room;
                that.updateUI();
            }
            catch (e)
            {
            }
        }

        xhr.onload = reqListener;
        xhr.open("GET", 'https://bzlzgmgcuh.execute-api.eu-west-2.amazonaws.com/default/loveletter-create');
        xhr.setRequestHeader("Content-Type", "text/plain");
        xhr.send();
    }

    /*
    setupInteraction()
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
    }

    setupRoundEnd()
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
    }
    */

    getAlreadyPickedCharacterIds()
    {
        var alreadyPickedIds = [];

        var i;
        var playerDetails;
        for (i = 0; i < this.playerDetails.length; i += 1)
        {
            playerDetails = this.playerDetails[i];
            if (playerDetails.characterId !== undefined && playerDetails.characterId !== this.pickedCharacterId)
                alreadyPickedIds.push(playerDetails.characterId);
        }
        return alreadyPickedIds;
    }

    /*setupPickCharacter()
    {
        if (!this.loadedPages.pickcharacter)
        {
            return;
        }

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

        document.getElementById("pickCharacterRoomCodeSpan").innerHTML = this.getRoomCode();
    }*/

    selectCharacter(id : number)
    {
        this.selectedCharacterId = id;
    }

    pickCharacter()
    {
        this.send({ "cmd": "PICK_CHARACTER", "characterId": this.selectedCharacterId });
    }

    getCardDiscardedCountArray()
    {
        var result = [];
        var i;
        for (i = 0; i < orderedCards.length; i += 1)
        {
            result[i] = this.getCardDiscardedCount(orderedCards[i]);
        }
        return result;
    }

    getCardDiscardedCount(cardStr : CardType)
    {
        var i;
        var j;
        var total = 0;
        for (i = 0; i < this.playerDetails.length; i += 1)
        {
            var discarded : CardType[] = this.playerDetails[i].discarded;
            for (j = 0; j < discarded.length; j += 1)
            {
                if (discarded[j] === cardStr)
                    total += 1;
            }
        }
        return total;
    }

    send(jsonData : any)
    {
        jsonData["room"] = this.roomcode;
        this.websocket!.send(JSON.stringify(jsonData));
    }

    /*resetTurnState()
    {
        this.playingCardId = -1;
        this.playingCard = -1;
        this.playingCardStr = '';
        this.pickedPlayer = -1;
        this.interaction = {};
    }

    disconnect()
    {
        this.websocket.close();
        this.localStorage.removeItem('room');
        this.resetGame();
    }

    onopen()
    {
        this.send({ "cmd": "GET" });
        this.gameState = null;
        document.getElementById("roomCodeSpan").innerHTML = this.getRoomCode();
    }

    start()
    {
        this.send({ "cmd": "START" });
    }

    restart()
    {
        this.send({ "cmd": "RESTART" });
    }

    forceRoundEnd()
    {
        this.send({ "cmd": "FORCE_ROUND_END" });
    }

    onmessage(strData)
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
                    this.setupGame();
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
    }

    updateUIState(data)
    {
        this.ui.playerDetails = [];
        var i;
        for (i = 0; i < data.players.length; i += 1)
        {
            var player = data.players[i];
            var playerDetails = {
                name: player.name,
                characterId: player.characterId,
                tokens: [3,4,5],
                state: "ALIVE",
                discarded: []
            };

            if (data.playerStates)
            {
                var playerState = data.playerStates[i];
                var j;
                for (j = 0; j < playerState.wins; j += 1)
                {
                    playerDetails.tokens.push(1);
                }
                for (j = 0; j < playerState.played.length; j += 1)
                {
                    playerDetails.discarded.push(cardTypes[playerState.played[j]]);
                }
            }

            this.ui.playerDetails.push(playerDetails);
        }
    }

    cardPlayStateReset()
    {
        this.cardPlayState = {state: "WAIT", "handCardId": -1};
    }

    pickCard(handCardId)
    {
        this.cardPlayState.handCardId = handCardId;
        var cardType = cardTypes[this.hand[handCardId]];
        if (cardType == "GUARD" ||
            cardType == "PRIEST" ||
            cardType == "BARON" ||
            cardType == "PRINCE" ||
            cardType == "KING")
        {
            this.cardPlayState.state = "PLAYED";
            this.setupGame();
        }
        else
        {
            this.sendPlayCard(handCardId);
        }
    }

    pickTarget(targetId)
    {
        var cardType = cardTypes[this.hand[this.cardPlayState.handCardId]];
        if (cardType == "GUARD")
        {
            this.cardPlayState.target = targetId;
            this.cardPlayState.state = "GUESS";
            this.setupGame();
        }
        else
        {
            this.sendPlayCard(this.cardPlayState.handCardId, targetId);
        }
    }

    pickGuess(guess)
    {
        this.sendPlayCard(this.cardPlayState.handCardId, this.cardPlayState.target, guess);
    }

    playBack()
    {
        if (this.cardPlayState.state == "PLAYED")
        {
            this.cardPlayState.target = null;
            this.cardPlayState.state = "TURN";
            this.setupGame();
        }
        else if (this.cardPlayState.state = "GUESS")
        {
            this.cardPlayState.state = "PLAYED";
            this.setupGame();
        }
    }

    gotFullState(data)
    {
        if (data.playerId !== undefined)
            this.playerId = data.playerId;
        this.numPlayers = data.players.length;

        var prevGameState = this.gameState;
        this.gameState = data.gamestate;

        if (data.gamestate == "LOGIN")
        {
            this.updateUIState(data);
            this.pickedCharacterId = data.players[this.playerId].characterId;
            this.selectedCharacterId = this.pickedCharacterId;
            this.cardPlayStateReset();
            this.loadPage("pickcharacter.html");
            this.setupPickCharacter();
        }
        else if (data.gamestate == "PLAYING")
        {
            this.hand = data.hand || [];
            this.turnId = data.turn;
            this.playerStates = data.playerStates;
            this.interaction = data.interaction;
            this.cardPlayState = {state: this.turnId == this.playerId ? "TURN" : "WAIT"};
            this.updateUIState(data);
            this.loadPage("game.html");
            this.setupGame();
        }
    }

    discard(data)
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
                }
            }
        }
        else
        {
            playerState.played.push(data.card);
        }
    }

    nextTurn(data)
    {
        this.turnId = data.turn;
        this.interaction = {};
        // TODO update gui
    }

    addCard(card)
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
        this.setupGame();
    }

    roundComplete()
    {
    }

    pickPlayer(pickedId)
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
    }

    guess(guessCardIndex)
    {
        if (guessCardIndex == -1) // back
        {
            return;
        }

        var cardStr = orderedCards[guessCardIndex];
        this.sendPlayCard(this.playingCardId, this.pickedPlayer, cardStr);
    }

    sendPlayCard(cardId, target, guess)
    {
        var cmd;
        if (cardId == 0)
            cmd = "PLAY_HAND";
        else if (cardId == 1)
            cmd = "PLAY_PICKUP";

        var msg = { "room": this.getRoomCode(), "cmd": cmd };
        if (target !== undefined)
            msg["target"] = target;
        if (guess !== undefined)
            msg["guess"] = guess;
        this.send(msg);
        this.resetTurnState();

        this.hand.splice(cardId, 1);
    }

    getOtherCard()
    {
        var i;
        for (i = 0; i < 2; i += 1)
        {
            if (this.hand[i] !== this.interaction.card)
                return this.hand[i];
        }
        return this.hand[0];
    }

    anyValidTargets()
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
    }

    reveal()
    {
        var i;
        var j;
        var myTurn = this.playerId == this.turnId;
        var target = this.interaction.target;
        var isTarget = this.playerId == target;
        var cardStr = cardTypes[this.interaction.card];
        if (cardStr == "KING" && this.interaction.swClientAppedFor !== undefined)
        {
            this.hand[0] = this.interaction.swClientAppedFor;
            this.updateHandText();
        }
    }

    endTurn()
    {
    }

    updateInteraction()
    {
        if (this.interaction.state == "ROUND_COMPLETE")
        {
            this.roundComplete();
            return;
        }
    }*/
}

export let clientApp = new ClientApp();

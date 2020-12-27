import { CardType, getCardType, orderedCards } from "./cards";
import { GameState, Interaction, PlayerDetails } from "./Shared";
import { EventHandler, LVListenerList, LVUIProperty } from "./UIListeners";

class ClientApp
{
    pickedCharacterId : number;
    alreadyPickedIds : number[];
    playerId : number;
    numPlayers : number;
    key: number | null;
    username: string;
    roomcode: string;
    websocket: WebSocket | null;
    playerDetails: PlayerDetails[];
    gameState: GameState;
    loggedIn: boolean;

    prevUIData: any;

    hand : CardType[];
    turnId : number;
    interaction : Interaction;
    hasInteraction : boolean;

    uiEventHandler : EventHandler;

    constructor()
    {
        this.uiEventHandler = new EventHandler();

        this.pickedCharacterId = -1;
        this.alreadyPickedIds = [];
        this.playerId = -1;
        this.numPlayers = 0;
        this.hand = [];
        this.turnId = -1;
        this.playerDetails = [];
        this.gameState = "LOGIN";
        this.loggedIn = false;
        this.hasInteraction = false;
        this.interaction = {
            targetId: -1,
            playedCard: "GUARD",
            status: "REVEAL"
        };
        
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

        function preloadImage(url : string)
        {
            var img = new Image();
            img.src = url;
        }
        var i;
        for (i = 0; i < orderedCards.length; i += 1)
        {
            preloadImage("img/" + orderedCards[i] + ".png");
        }
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
        var uiValues : any = {
            playerDetails: this.playerDetails,
            hand: this.hand,
            playerId: this.playerId,
            turnId: this.turnId,
            interaction: this.interaction,
            hasInteraction: this.hasInteraction,
            gameState: this.gameState,
            loggedIn: this.loggedIn,
            username: this.username,
            roomcode: this.roomcode,
            pickedCharacterId: this.pickedCharacterId,
        };
        function addProperty(prop : LVUIProperty, cb : any)
        {
            if (p === null || prop === p)
            {
                uiValues[prop] = cb();
            }
        }
        addProperty("discardedCardTotals", () => this.getCardDiscardedCountArray());
        addProperty("alreadyPickedIds", () => this.getAlreadyPickedCharacterIds());
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
                this.uiEventHandler.propertyChange(p as LVUIProperty, JSON.parse(valueStr));
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
            that.gameState = "LOGIN";
            that.loggedIn = false;
            that.updateUI();
        };
        this.websocket.onerror = function (/*event*/) {
            that.uiEventHandler.triggerEvent("connectionError", that.roomcode + "");
            that.roomcode = "";
            that.loggedIn = false;
            that.updateUI();
        };
    }

    onopen()
    {
        this.send({ "cmd": "GET" });
        this.loggedIn = true;
        this.updateUI();
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
        this.alreadyPickedIds = [];

        var i;
        var playerDetails;
        for (i = 0; i < this.playerDetails.length; i += 1)
        {
            playerDetails = this.playerDetails[i];
            if (i === this.playerId)
                continue;
            if (playerDetails.characterId !== undefined)
                this.alreadyPickedIds.push(playerDetails.characterId);
        }
        return this.alreadyPickedIds;
    }

    pickCharacter(selectedCharacterId : number)
    {
        this.send({ "cmd": "PICK_CHARACTER", "characterId": selectedCharacterId });
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
    */
    start()
    {
        this.send({ "cmd": "START" });
    }
    /*
    restart()
    {
        this.send({ "cmd": "RESTART" });
    }

    forceRoundEnd()
    {
        this.send({ "cmd": "FORCE_ROUND_END" });
    }

    */
    onmessage(strData : string)
    {
        var data = JSON.parse(strData);
        switch(data.cmd) {
            case "CHARACTER_ID_IN_USE":
                this.uiEventHandler.triggerEvent("pickedCharacterInUse");
            break;
            case "CHARACTER_PICKED":
                this.playerDetails[data.playerId].characterId = data.characterId;
                if (data.playerId === this.playerId)
                {
                    this.pickedCharacterId = data.characterId;
                    this.uiEventHandler.triggerEvent("redirect", "/tabs");
                }
            break;
            case "START_CARD":
                this.playerId = data.playerId;
                this.addCard(getCardType(data.pickup));
            break;
            case "PICKUP":
            case "YOUR_TURN":
                // clear your SAFE state
                this.playerDetails[this.playerId].state = "ALIVE";
                this.addCard(getCardType(data.pickup));
            break;
            case "JOINED":
                this.playerDetails[data.index] = {
                    name: data.name,
                    characterId: data.characterId,
                    tokens: [],
                    state: "ALIVE",
                    discarded: []
                };
            break;
            case "START_GAME":
            case "STATE":
            case "PLAYED":
            case "NEXT_ROUND":
                this.gotFullState(data);
            break;
            case "END_TURN":
                this.endTurn();
                this.gotFullState(data);
            break;
            case "REVEALED":
                this.interaction.status = "CONTINUE";
                this.reveal();
            break;
            case "NEXT_TURN":
                this.nextTurn(data);
            break;
            case "DISCARD":
                this.discard(data);
            break;
            case "ROUND_COMPLETE":
                this.turnId = data.turn;
                this.updatePlayerDetails(data);
                this.updateInteraction();
            break;
        }

        this.updateUI();
    }
    
    updatePlayerDetails(data : any)
    {
        this.playerDetails = [];
        var i;
        for (i = 0; i < data.players.length; i += 1)
        {
            var player = data.players[i];
            var playerDetails : PlayerDetails = {
                name: player.name,
                characterId: player.characterId,
                tokens: [],
                state: "ALIVE",
                discarded: []
            };

            if (data.playerStates)
            {
                var playerState = data.playerStates[i];
                var j;
                for (j = 0; j < playerState.wins; j += 1)
                {
                    playerDetails.tokens.push({gem: 1});
                }
                for (j = 0; j < playerState.played.length; j += 1)
                {
                    playerDetails.discarded.push(getCardType(playerState.played[j]));
                }
                playerDetails.state = playerState.state;
            }

            if (this.playerId === i)
            {
                this.pickedCharacterId = player.characterId;
            }

            this.playerDetails.push(playerDetails);
        }
    }

    playCard(handCardId : number, target? : number, guess? : CardType)
    {
        var cmd;
        if (handCardId === 0)
            cmd = "PLAY_HAND";
        else if (handCardId === 1)
            cmd = "PLAY_PICKUP";

        var msg : any = { "room": this.roomcode, "cmd": cmd };
        if (target !== undefined)
            msg["target"] = target;
        if (guess !== undefined)
            msg["guess"] = guess;
        this.send(msg);

        this.hand.splice(handCardId, 1);
    }
    /*
    pickTarget(targetId)
    {
        var cardType = cardTypes[this.hand[this.cardPlayState.handCardId]];
        if (cardType === "GUARD")
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
    }

    playBack()
    {
        if (this.cardPlayState.state === "PLAYED")
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
    */
    gotFullState(data : any)
    {
        if (data.playerId !== undefined)
            this.playerId = data.playerId;
        this.numPlayers = data.players.length;

        var prevGameState = this.gameState;
        this.gameState = data.gamestate;
        
        if (prevGameState === "LOGIN")
        {
            this.uiEventHandler.triggerEvent("redirect", (data.gamestate === "LOGIN") ? "/page/PickCharacter" : "/tabs");
        }

        if (data.gamestate === "LOGIN")
        {
            this.updatePlayerDetails(data);
        }
        else if (data.gamestate === "PLAYING")
        {
            this.covertHandNumbersToCards(data.hand || []);
            this.turnId = data.turn;
            var prevHadInteraction = this.hasInteraction;
            this.hasInteraction = data.interaction.state !== undefined;
            if (this.hasInteraction)
            {
                this.interaction = {
                    playedCard: getCardType(data.interaction.card),
                    otherCard: getCardType(data.interaction.otherCard),
                    status: data.interaction.state,
                    guess: data.interaction.guess,
                    result: data.interaction.result,
                    targetId: data.interaction.target,
                    loserId: data.interaction.loser,
                    revealedCard: getCardType(data.interaction.revealedCard),
                    discard: getCardType(data.interaction.discard),
                    swappedFor: getCardType(data.interaction.swappedFor),
                    prevCard: getCardType(data.interaction.prevCard),
                };
            }
            this.updatePlayerDetails(data);

            if (this.hasInteraction && !prevHadInteraction)
            {
                this.uiEventHandler.triggerEvent("redirect", "/tabs/interaction");
            }
        }
    }

    covertHandNumbersToCards(data : number[])
    {
        this.hand = [];
        var i;
        for (i = 0; i < data.length; i += 1)
        {
            this.hand.push(getCardType(data[i]));
        }
    }

    discard(data : any)
    {
        var playerDetails = this.playerDetails[data.playerId];
        if (data.playerId === this.playerId)
        {
            var i;
            for (i = 0; i < this.hand.length; i += 1)
            {
                if (data.card === this.hand[i])
                {
                    playerDetails.discarded.push(data.card);
                    this.hand.splice(i, 1);
                }
            }
        }
        else
        {
            playerDetails.discarded.push(data.card);
        }
    }

    nextTurn(data : any)
    {
        this.turnId = data.turn;
        this.hasInteraction = false;
    }

    addCard(card : CardType)
    {
        var i;
        for (i = 0; i < this.hand.length; i += 1)
        {
            if (card === this.hand[i])
            {
                return;
            }
        }
        this.hand.push(card);
    }

    roundComplete()
    {
    }

    /*
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
            if (i !== this.turnId && this.playerStates[i].state === "ALIVE")
            {
                return true;
            }
        }
        return false;
    }
    */
    interactionStep()
    {
        this.send({"cmd": this.interaction.status});
    }

    reveal()
    {
        if (this.interaction.playedCard === "KING" && this.interaction.swappedFor !== undefined)
        {
            this.hand[0] = this.interaction.swappedFor;
        }
    }
    
    endTurn()
    {
        this.hasInteraction = false;
    }
    
    updateInteraction()
    {
        if (this.interaction.status === "ROUND_COMPLETE")
        {
            this.roundComplete();
            return;
        }
    }
}

export let clientApp = new ClientApp();

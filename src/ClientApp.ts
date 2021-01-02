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
    roomSeed: number;

    prevUIData: any;

    hand : CardType[];
    handIds : number[];
    turnId : number;
    interaction : Interaction;

    uiEventHandler : EventHandler;
    delayUiUpdates : boolean;
    gotoTab : string | null;

    constructor()
    {
        this.uiEventHandler = new EventHandler();
        this.delayUiUpdates = false;
        this.gotoTab = null;

        this.pickedCharacterId = -1;
        this.alreadyPickedIds = [];
        this.playerId = -1;
        this.numPlayers = 0;
        this.hand = [];
        this.handIds = [];
        this.turnId = -1;
        this.playerDetails = [];
        this.gameState = "LOGIN";
        this.loggedIn = false;
        this.interaction = {
            playerId: -1,
            targetId: -1,
            playedCard: "GUARD",
            status: null
        };
        this.roomSeed = 0;
        
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
        var that = this;
        listeners.setProperties(this.buildUIValues(null));
        this.uiEventHandler.register(listeners);
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
            gameState: this.gameState,
            loggedIn: this.loggedIn,
            username: this.username,
            roomcode: this.roomcode,
            pickedCharacterId: this.pickedCharacterId,
            roomSeed: this.roomSeed,
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

    updateUI(tag : string = "")
    {
        if (this.delayUiUpdates && tag === "")
            return;

        var nextUIValue : any = this.buildUIValues(null);

        var p : string;
        for (p in this.uiEventHandler.properties)
        {
            var valueStr = JSON.stringify(nextUIValue[p])
            this.uiEventHandler.propertyChange(p as LVUIProperty, valueStr, JSON.parse(valueStr), tag);
            this.prevUIData[p] = valueStr;
        }
    }

    getUiProperty(p : LVUIProperty)
    {
        return this.buildUIValues(p)[p];
    }

    resetGame()
    {
        this.hand = [];
        this.handIds = [];
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

        function getAlphaIndex(str : string, index : number)
        {
            return str.charCodeAt(0) - "A".charCodeAt(0);
        }

        this.roomSeed = 41 * (getAlphaIndex(this.roomcode, 0) +
                            (getAlphaIndex(this.roomcode, 1) * 26 +
                            (getAlphaIndex(this.roomcode, 2) * 26 +
                            (getAlphaIndex(this.roomcode, 3) * 26))));

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
            if (playerDetails.characterId !== -1)
                this.alreadyPickedIds.push(playerDetails.characterId);
        }
        return this.alreadyPickedIds;
    }

    pickCharacter(selectedCharacterId : number)
    {
        this.send({ "cmd": "PICK_CHARACTER", "characterId": selectedCharacterId });
    }

    clearPickedCharacter()
    {
        this.send({ "cmd": "CLEAR_PICKED_CHARACTER" });
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
        var prevInteractionStatus = this.interaction.status;
        if (prevInteractionStatus === "CONTINUE")
            prevInteractionStatus = "REVEAL";

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
                    this.uiEventHandler.triggerEvent("redirect", "/tabs/game");
                }
            break;
            case "CLEAR_CHARACTER_PICK":
                this.playerDetails[data.playerId].characterId = -1;
            break;
            case "START_CARD":
                this.playerId = data.playerId;
                this.addCard(data.pickup);
            break;
            case "PICKUP":
            case "YOUR_TURN":
                // clear your SAFE state
                this.playerDetails[this.playerId].state = "ALIVE";
                this.addCard(data.pickup);
            break;
            case "JOINED":
                if (data.index >= this.playerDetails.length)
                {
                    this.playerDetails[data.index] = {
                        name: data.name,
                        characterId: (data.characterId === undefined || data.characterId === null) ? -1 : data.characterId,
                        wins: 0,
                        state: "ALIVE",
                        discarded: []
                    };
                }
                else
                {
                    var joinedPlayer = this.playerDetails[data.index];
                    joinedPlayer.name = data.name;
                    joinedPlayer.characterId = (data.characterId === undefined || data.characterId === null) ? -1 : data.characterId;
                }
            break;
            case "START_GAME":
            case "STATE":
            case "PLAYED":
            case "NEXT_ROUND":
            case "END_TURN":
            case "ROUND_COMPLETE":
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
        }

        var newInteractionStatus = this.interaction.status;
        if (newInteractionStatus === "CONTINUE")
            newInteractionStatus = "REVEAL";

        if (newInteractionStatus !== prevInteractionStatus)
        {
            var gotoTab : string | undefined;
            if (this.interaction.status !== null)
            {
                if (this.interaction.status === "ROUND_COMPLETE")
                {
                    this.updateUI("roundComplete");
                    gotoTab = "/page/RoundComplete";
                }
                else
                {
                    this.updateUI("interaction");
                    gotoTab = "/tabs/interaction";
                }
            }
            else if (window.location.pathname === "/tabs/interaction" ||
                     window.location.pathname === "/page/RoundComplete")
            {
                this.updateUI("game");
                gotoTab = "/tabs/game";
            }
            
            if (gotoTab)
            {
                this.delayUiUpdates = true; // delay any UI updates until the page has changed...

                var that = this;
                this.gotoTab = gotoTab;
                setTimeout(function ()
                {
                    // once the page UI has updated switch to it
                    that.uiEventHandler.triggerEvent("redirect", that.gotoTab);
                    var intervalId = setInterval(function ()
                    {
                        if (window.location.pathname === that.gotoTab)
                        {
                            that.gotoTab = null;
                            that.delayUiUpdates = false;
                            that.updateUI();
                            clearInterval(intervalId!);
                        }
                    }, 10);
                }, 1);
            }
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
                characterId: (player.characterId === null || player.characterId === undefined) ? -1 : player.characterId,
                wins: 0,
                state: "ALIVE",
                discarded: []
            };

            if (data.playerStates)
            {
                var playerState = data.playerStates[i];
                playerDetails.wins = playerState.wins;
                var j;
                for (j = 0; j < playerState.played.length; j += 1)
                {
                    playerDetails.discarded.push(getCardType(playerState.played[j]));
                }
                playerDetails.state = playerState.state;
            }

            if (this.playerId === i)
            {
                this.pickedCharacterId = (player.characterId === null || player.characterId === undefined) ? -1 : player.characterId;
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
        this.delayUiUpdates = true; // delay any UI updates until the page has changed to interaction...
    }

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
            this.handIds = data.hand || [];
            this.hand = this.covertNumbersToCards(data.hand || []);
            this.turnId = data.turn;
            if (data.interaction.state === undefined)
            {
                this.interaction.status = null;
            }
            else
            {
                this.interaction = {
                    playerId: data.interaction.playerId,
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
                    swappedForCardId: data.interaction.swappedFor,
                    prevCard: getCardType(data.interaction.prevCard),

                    // round end state
                    hiddenCard: getCardType(data.interaction.hiddenCard),
                    finalCards: this.covertNumbersToCards(data.interaction.finalCards || []),
                    winnerIds: data.interaction.roundWinners,
                    gameWinner: data.interaction.gameWinner
                };
            }
            this.updatePlayerDetails(data);
        }
    }

    covertNumbersToCards(data : number[]) : CardType[]
    {
        var result : CardType[] = [];
        var i;
        for (i = 0; i < data.length; i += 1)
        {
            result.push(getCardType(data[i]));
        }
        return result;
    }

    discard(data : any)
    {
        var playerDetails = this.playerDetails[data.playerId];
        var discardCard : CardType = getCardType(data.card);
        if (data.playerId === this.playerId && !data.played)
        {
            var i;
            for (i = 0; i < this.handIds.length; i += 1)
            {
                if (data.card === this.handIds[i])
                {
                    playerDetails.discarded.push(discardCard);
                    this.hand.splice(i, 1);
                    this.handIds.splice(i, 1);
                }
            }
        }
        else
        {
            playerDetails.discarded.push(discardCard);
        }
    }

    nextTurn(data : any)
    {
        this.turnId = data.turn;
        this.interaction.status = null;
        // clear the SAFE state
        this.playerDetails[this.turnId].state = "ALIVE";
    }

    addCard(cardId : number)
    {
        var i;
        for (i = 0; i < this.handIds.length; i += 1)
        {
            if (cardId === this.handIds[i])
            {
                return;
            }
        }
        this.hand.push(getCardType(cardId));
        this.handIds.push(cardId);
    }

    roundComplete(data : any)
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
    */
    interactionStep()
    {
        if (this.interaction.status === "CONTINUE" ||
            this.interaction.status === "ROUND_COMPLETE")
        {
            // wait for the page to change before updating any UI
            this.delayUiUpdates = true;
        }
        this.send({"cmd": this.interaction.status});
    }

    reveal()
    {
        if (this.interaction.playedCard === "KING" && this.interaction.swappedForCardId !== undefined)
        {
            this.hand[0] = this.interaction.swappedFor!;
            this.handIds[0] = this.interaction.swappedForCardId!;
        }
    }
}

export let clientApp = new ClientApp();

declare global {
    interface Window { expose: any; }
}
window.expose = { clientApp: clientApp };

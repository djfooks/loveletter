export type CardType = "GUARD" | "PRIEST" | "BARON" | "HANDMAID" | "PRINCE" | "KING" | "COUNTESS" | "PRINCESS";

export const orderedCards : CardType[] = ["GUARD", "PRIEST", "BARON", "HANDMAID", "PRINCE", "KING", "COUNTESS", "PRINCESS"];

class CardDetailsMapValue {
    value: number;
    name: string;
    numInDeck: number;
    shortAction: string;
    action: string;
    cardType: CardType;
    
    constructor(map : {
        value: number;
        name: string;
        numInDeck: number;
        shortAction: string;
        action: string;
    }) {
        this.value = map.value;
        this.name = map.name;
        this.numInDeck = map.numInDeck;
        this.shortAction = map.shortAction;
        this.action = map.action;
        this.cardType = orderedCards[map.value];
    }
}

interface CardDetailsMap {
    [key: string]: CardDetailsMapValue;
}

var cardDetailsMapExport : CardDetailsMap = {
    "GUARD":    new CardDetailsMapValue({ "value": 1, "name": "Guard", "numInDeck": 5,
        "shortAction": "Guess another players card (you cannot guess \"Guard\").",
        "action": "Pick another player and guess their card type (you cannot guess \"Guard\"). If correct, the other player is eliminated." }),
    "PRIEST":   new CardDetailsMapValue({ "value": 2, "name": "Priest", "numInDeck": 2,
        "shortAction": "Pick another player to privately see their hand.",
        "action": "Pick another player to privately see their hand." }),
    "BARON":    new CardDetailsMapValue({ "value": 3, "name": "Baron", "numInDeck": 2,
        "shortAction": "Pick another player and compare hands. Lowest value is eliminated.",
        "action": "Pick another player and privately compare hands. The player with the lower-strength hand is eliminated." }),
    "HANDMAID": new CardDetailsMapValue({ "value": 4, "name": "Handmaid", "numInDeck": 2,
        "shortAction": "You cannot be targeted until your next turn.",
        "action": "You cannot be targeted until your next turn." }),
    "PRINCE":   new CardDetailsMapValue({ "value": 5, "name": "Prince", "numInDeck": 2,
        "shortAction": "Pick any player to discard their hand and draw a new one.",
        "action": "Pick any player (including youself) to discard their hand and draw a new one. If they discard the Princess they are eliminated." }),
    "KING":     new CardDetailsMapValue({ "value": 6, "name": "King", "numInDeck": 1,
        "shortAction": "Pick another player and trade hands with them.",
        "action": "Pick another player and trade hands with them." }),
    "COUNTESS": new CardDetailsMapValue({ "value": 7, "name": "Countess", "numInDeck": 1,
        "shortAction": "Must be played if your other card is a King or Prince.",
        "action": "If your other card is a King or Prince card, this card must be played." }),
    "PRINCESS": new CardDetailsMapValue({ "value": 8, "name": "Princess", "numInDeck": 1,
        "shortAction": "If you play this card for any reason, you are eliminated.",
        "action": "If you play this card for any reason, you are eliminated from the round." }),
};

export const tokensToWinMap : number[] = [ -1, -1, 7, 5, 4, 4, 4, 4, 4 ];

var cardTypesExport : string[] = [];
function init()
{
    function addCardTypes(cardStr : string)
    {
        var i;
        var count = cardDetailsMapExport[cardStr].numInDeck;
        for (i = 0; i < count; i += 1)
        {
            cardTypesExport.push(cardStr);
        }
    }

    var i;
    for (i = 0; i < orderedCards.length; i += 1)
    {
        addCardTypes(orderedCards[i]);
        cardDetailsMapExport[orderedCards[i]].cardType = orderedCards[i];
    }
}
init();

export function getCardName(card : number) : string
{
    return cardDetailsMapExport[cardTypes[card]].name + " (" + cardDetailsMapExport[cardTypes[card]].value + ")";
}

export function getCardType(card : number) : CardType
{
    return cardTypesExport[card] as CardType;
}

export const totalNumberOfCards = cardTypesExport.length;

export function getCardDetails(cardTypeStr : CardType) : CardDetailsMapValue
{
    return cardDetailsMapExport[cardTypeStr as string];
}
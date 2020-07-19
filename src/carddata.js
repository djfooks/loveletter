var cardTypes = [];

var cardDetailsMap = {
    "GUARD":    { "value": 1, "name": "Guard", "numInDeck": 5,
        "shortAction": "Guess another players card (you cannot guess \"Guard\").",
        "action": "Pick another player and guess their card type (you cannot guess \"Guard\"). If correct, the other player is eliminated." },
    "PRIEST":   { "value": 2, "name": "Priest", "numInDeck": 2,
        "shortAction": "Pick another player to privately see their hand.",
        "action": "Pick another player to privately see their hand." },
    "BARON":    { "value": 3, "name": "Baron", "numInDeck": 2,
        "shortAction": "Pick another player and compare hands. Lowest value is eliminated.",
        "action": "Pick another player and privately compare hands. The player with the lower-strength hand is eliminated." },
    "HANDMAID": { "value": 4, "name": "Handmaid", "numInDeck": 2,
        "shortAction": "You cannot be targeted until your next turn.",
        "action": "You cannot be targeted until your next turn." },
    "PRINCE":   { "value": 5, "name": "Prince", "numInDeck": 2,
        "shortAction": "Pick any player to discard their hand and draw a new one.",
        "action": "Pick any player (including youself) to discard their hand and draw a new one. If they discard the Princess they are eliminated." },
    "KING":     { "value": 6, "name": "King", "numInDeck": 1,
        "shortAction": "Pick another player and trade hands with them.",
        "action": "Pick another player and trade hands with them." },
    "COUNTESS": { "value": 7, "name": "Countess", "numInDeck": 1,
        "shortAction": "Must be played if your other card is a King or Prince.",
        "action": "If your other card is a King or Prince card, this card must be played." },
    "PRINCESS": { "value": 8, "name": "Princess", "numInDeck": 1,
        "shortAction": "If you play this card for any reason, you are eliminated.",
        "action": "If you play this card for any reason, you are eliminated from the round." },
};

var orderedCards = ["GUARD", "PRIEST", "BARON", "HANDMAID", "PRINCE", "KING", "COUNTESS", "PRINCESS"];

var tokensToWinMap = [ -1, -1, 7, 5, 4, 4, 4, 4, 4 ];

function init()
{
    function addCardTypes(cardStr)
    {
        var i;
        var count = cardDetailsMap[cardStr].numInDeck;
        for (i = 0; i < count; i += 1)
        {
            cardTypes.push(cardStr);
        }
    }

    var i;
    for (i = 0; i < orderedCards.length; i += 1)
    {
        addCardTypes(orderedCards[i]);
        cardDetailsMap[orderedCards[i]].cardType = orderedCards[i];
    }
}
init();

function getCardName(card)
{
    return cardDetailsMap[cardTypes[card]].name + " (" + cardDetailsMap[cardTypes[card]].value + ")";
}

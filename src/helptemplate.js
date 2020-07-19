
function HelpTemplate()
{
}

HelpTemplate.update = function (app)
{
    var i;
    var j;
    for (i = 0; i < orderedCards.length; i += 1)
    {
        var html = "";
        var cardTypeStr = orderedCards[i];
        var cardDetails = cardDetailsMap[cardTypeStr];
        html += '<div class="helpCardDetails">'
        html += '<span class="cardName cardName' + cardTypeStr + '">' + cardDetails.name + " (" + cardDetails.value + ")" + '</span>\n';
        html += '<div class="displayCards">\n'
        for (j = 1; j <= cardDetails.numInDeck; j += 1)
        {
            if (j < app.getCardPlayedCount(cardTypeStr))
            {
                html += '<div class="displayCard"></div>\n';
            }
            else
            {
                html += '<div class="displayCard cardInDeck"></div>\n';
            }
        }
        html += '</div>\n'
        html += '<span class="cardDescription">' + cardDetails.shortAction + '</span>';
        html += '</div>\n'

        app.cardHelpDiv[i].innerHTML = html;
    }
};

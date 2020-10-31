
function Helpers()
{
}

Helpers.setCard = function (element, cardTypeStr)
{
    var cardDetails = cardDetailsMap[cardTypeStr];
    element.className = "cardName cardName" + cardTypeStr;
    element.innerHTML = cardDetails.name + " (" + cardDetails.value + ")";
};

Helpers.setHidden = function (element, hidden)
{
    if (hidden)
    {
        if (element.className.indexOf("hidden") === -1)
        {
            element.className += " hidden";
        }
    }
    else
    {
        element.className = element.className.replace("hidden", "");
        element.className = element.className.trim();
    }
};

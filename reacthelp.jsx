
function QuickHelpList(props)
{
    return orderedCards.map((cardType, index) =>
        <div key={cardType}>
            <CardName card={cardType} />
            <span className="alignRight">{props.remainingCards[index]} / {cardDetailsMap[cardType].numInDeck}</span>
            <br />
            <br />
        </div>
    );
}

function QuickHelpCard(props)
{
    return (
        <ons-card>
            <span className="alignLeft">Card (value)</span>
            <span className="alignRight">Remaining / In Deck</span><br/><br/>
            <QuickHelpList remainingCards={props.remainingCards} />
        </ons-card>
    );
}

function HelpCardItems(props)
{
    return orderedCards.map((cardType, index) =>
        <ons-carousel-item key={cardType}>
            <ons-card>
                <CardImgAndDetails card={cardType} />
                <div className="remainingText">Remaining {props.remainingCards[index]} / {cardDetailsMap[cardType].numInDeck}</div>
            </ons-card>
        </ons-carousel-item>
    );
}

function HelpCarouselItems(props)
{
    return (
        <ons-carousel id="helpCarousel" fullscreen swipeable auto-scroll auto-scroll-ratio="0.1">
            <ons-carousel-item>
                <QuickHelpCard remainingCards={props.remainingCards} />
            </ons-carousel-item>
            <HelpCardItems remainingCards={props.remainingCards} />
        </ons-carousel>
    );
}

function getHelpElement(helpData)
{
    return <HelpCarouselItems remainingCards={helpData.remainingCards} />;
}

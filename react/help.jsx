
function QuickHelpList(props)
{
    return orderedCards.map((cardType, index) =>
        <div key={cardType}>
            <CardName card={cardType} />
            <span className="alignRight">{props.playedCardTotals[index]} / {cardDetailsMap[cardType].numInDeck}</span>
            <br />
            <br />
        </div>
    );
}

function QuickHelpCard(props)
{
    return (
        <Ons.Card>
            <span className="alignLeft">Card (value)</span>
            <span className="alignRight"># Played / # In Deck</span><br/><br/>
            <QuickHelpList playedCardTotals={props.playedCardTotals} />
        </Ons.Card>
    );
}

function HelpCardItems(props)
{
    return orderedCards.map((cardType, index) =>
        <Ons.CarouselItem key={cardType}>
            <Ons.Card>
                <CardImgAndDetails card={cardType} />
                <div className="remainingText">Played {props.playedCardTotals[index]} / {cardDetailsMap[cardType].numInDeck}</div>
            </Ons.Card>
        </Ons.CarouselItem>
    );
}

function HelpCarouselItems(props)
{
    return (
        <Ons.Carousel id="helpCarousel" fullscreen swipeable auto-scroll auto-scroll-ratio="0.1">
            <Ons.CarouselItem>
                <QuickHelpCard playedCardTotals={props.playedCardTotals} />
            </Ons.CarouselItem>
            <HelpCardItems playedCardTotals={props.playedCardTotals} />
        </Ons.Carousel>
    );
}

function getHelpElement(helpData)
{
    return <HelpCarouselItems playedCardTotals={helpData.playedCardTotals} />;
}

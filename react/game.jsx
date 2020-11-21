
function GameCardItem(props)
{
    function handleClick()
    {
        app.playCard(props.cardId);
    }

    var playState;
    if (props.cardPlayState.state == "WAIT")
    {
        playState = null;
    }
    else if (props.cardPlayState.state == "TURN")
    {
        playState = (
            <div className="cardPlayButtonDiv">
                <ons-button onclick={handleClick}>Play</ons-button>
            </div>
        );
    }
    else if (props.cardPlayState.state == "PLAYED")
    {
        playState = (
            <div className="cardPlayButtonDiv">
                Pick a target
                <ons-list>
                {props.playerDetails.map((playerDetails, index) =>
                    <ons-list-item key={playerDetails.name}>
                        <PlayerLine playerDetails={playerDetails}>
                            {
                                playerDetails.state != "ALIVE" ?
                                    (<span className="playerName">{playerDetails.name}</span>) :
                                    (<ons-button>{playerDetails.name}</ons-button>)
                            }
                        </PlayerLine>
                    </ons-list-item>
                )}
                </ons-list>
            </div>
        );
    }
    else if (props.cardPlayState.state == "GUESS")
    {
        var targetPlayerDetails = props.playerDetails[props.cardPlayState.target];
        playState = (
            <div>
                <div className="interactionText">
                    Guess what card <PlayerCharacterName playerDetails={targetPlayerDetails} /> has
                </div>
                <ons-list>
                    {
                        orderedCards.map((cardType, index) =>
                            (cardType == "GUARD") ? null :
                            <ons-list-item key={index}>
                                <CardName card={cardType} />
                                <div className="right">
                                    <ons-button>Pick ({props.remainingCards[index]} / {cardDetailsMap[cardType].numInDeck})</ons-button>
                                </div>
                            </ons-list-item>
                        )
                    }
                </ons-list>
            </div>
        );
    }

    return (
        <ons-carousel-item>
            <ons-card>
                <CardImgAndDetails card={props.card} />
                {playState}
            </ons-card>
        </ons-carousel-item>
    );
}

function DiscardList(props)
{
    return props.cards.map((card, index) =>
            <div key={index}>
                <CardName card={card} />
            </div>
        );
}

function Tokens(props)
{
    return (
        <React.Fragment>
            {
                props.tokens.map((gem, index) =>
                    <img key={index} className="gemImg" style={ {"filter": "hue-rotate(180deg)"} } src="img/gem0.svg" />
                )
            }
        </React.Fragment>
    );
}

function PlayerLine(props)
{
    return (
        <React.Fragment>
            <PlayerCharacter playerDetails={props.playerDetails} />
            {props.children}
            <PlayerState state={props.playerDetails.state} />
            <div className="right">
                <Tokens tokens={props.playerDetails.tokens} />
                <span className="gemPadding"></span>
                {props.dropdown ? <span className="list-item__expand-chevron"></span> : null}
            </div>
        </React.Fragment>
    );
}

function PlayersList(props)
{
    return props.playerDetails.map((playerDetails, index) =>
        <ons-list-item expandable key={playerDetails.name}>
            <PlayerLine playerDetails={playerDetails} dropdown={true}>
                <span className="playerName">{playerDetails.name}</span>
            </PlayerLine>
            <div className="expandable-content">
                <div>Last played:</div>
                <DiscardList cards={playerDetails.discarded} />
            </div>
        </ons-list-item>
    );
}

function GameCarouselItems(props)
{
    var card1 = null;
    if (props.cards.length > 1)
    {
        card1 = <GameCardItem card={props.cards[1]} cardId={1} playerDetails={props.playerDetails} cardPlayState={props.cardPlayState} remainingCards={props.remainingCards} />;
    }

    return (
        <ons-carousel id="gameCarousel" fullscreen swipeable auto-scroll auto-scroll-ratio="0.1">
            <ons-carousel-item>
                <ons-card>
                    <ons-list>
                        <PlayersList playerDetails={props.playerDetails} tokenList={props.tokenList} />
                    </ons-list>
                </ons-card>
            </ons-carousel-item>
            <GameCardItem card={props.cards[0]} cardId={0} playerDetails={props.playerDetails} cardPlayState={props.cardPlayState} remainingCards={props.remainingCards} />
            {card1}
        </ons-carousel>
    );
}

function GameTopBar(props)
{
    function handleClick()
    {
        app.gameNext();
    }

    var cardsList = null;
    if (props.cards)
    {
        var card1 = null;
        if (props.cards.length > 1)
        {
            card1 = <span>, <CardName card={props.cards[1]} /></span>;
        }
        return (<span onClick={handleClick}>
            <CardName card={props.cards[0]} />
            {card1}
        </span>);
    }
    return null;
}

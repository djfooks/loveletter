
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
        if (props.otherCard == "COUNTESS" && (props.card == "KING" || props.card == "PRINCE"))
        {
            playState = (
                <div className="cardPlayButtonDiv">
                    Must play <CardName card={"COUNTESS"} />
                </div>
            );
        }
        else
        {
            playState = (
                <div className="cardPlayButtonDiv">
                    <ons-button onclick={handleClick}>Play</ons-button>
                </div>
            );
        }
    }
    else if (props.cardPlayState.state == "PLAYED")
    {
        playState = (
            <div className="cardPlayButtonDiv">
                Pick a target
                <ons-list>
                {props.playerDetails.map((playerDetails, index) =>
                    (props.playerId == index) ? null :
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
            <PlayerLine playerDetails={playerDetails} dropdown>
                <span className="playerName">{playerDetails.name}</span>
            </PlayerLine>
            <div className="expandable-content">
                {
                    playerDetails.discarded.length == 0 ?
                        (<div>Hi, I'm {playerDetails.name} and I {index == 0 ? "" : "also"} like to party</div>)
                    :
                        <React.Fragment>
                            <div>Last played:</div>
                            <DiscardList cards={playerDetails.discarded} />
                        </React.Fragment>
                }
            </div>
        </ons-list-item>
    );
}

function StartGameCard(props)
{
    function handleStart()
    {
        app.start();
    }

    if (props.gameState != "LOGIN")
        return null;

    if (props.playerId == 0)
    {
        return (
            <InteractionCard>
                <ons-button onClick={handleStart}>Start Game</ons-button>
            </InteractionCard>
        );
    }
    else
    {
        return (
            <ons-card>
                <div className="interactionText">
                    Waiting for game to start
                </div>
                <div className="interactionDots">
                    <DotDotDot />
                </div>
            </ons-card>
        );
    }
}

function GameCarouselItems(props)
{
    var card1 = null;
    if (props.cards.length > 1)
    {
        card1 = <GameCardItem card={props.cards[1]} cardId={1} otherCard={props.cards[0]} playerId={props.playerId} playerDetails={props.playerDetails} cardPlayState={props.cardPlayState} remainingCards={props.remainingCards} />;
    }

    return (
        <ons-carousel id="gameCarousel" fullscreen swipeable auto-scroll auto-scroll-ratio="0.1">
            <ons-carousel-item>
                <ons-card>
                    <ons-list>
                        <PlayersList playerDetails={props.playerDetails} tokenList={props.tokenList} />
                    </ons-list>
                </ons-card>
                <StartGameCard gameState={props.gameState} playerId={props.playerId} />
            </ons-carousel-item>
            {
                props.cards.length == 0 ? null :
                    <React.Fragment>
                        <GameCardItem card={props.cards[0]} cardId={0} otherCard={props.cards[1]} playerId={props.playerId} playerDetails={props.playerDetails} cardPlayState={props.cardPlayState} remainingCards={props.remainingCards} />
                        {card1}
                    </React.Fragment>
            }
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
    if (props.cards.length > 0)
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

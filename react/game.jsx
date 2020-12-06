
function GameCardItem(props)
{
    function handlePlayCardClick()
    {
        app.pickCard(props.handCardId);
    }

    function handlePickTargetClick(targetId)
    {
        app.pickTarget(targetId);
    }

    function handleNoValidTargetClick()
    {
        app.pickTarget(-1);
    }

    function handlePickGuessClick(guessCardType)
    {
        app.pickGuess(guessCardType);
    }

    function handleBackClick()
    {
        app.playBack();
    }

    var playState;
    if (props.cardPlayState.state == "WAIT")
    {
        playState = null;
    }
    else if (props.cardPlayState.state == "TURN" || props.cardPlayState.handCardId != props.handCardId)
    {
        if (props.otherCard == "COUNTESS" && (props.card == "KING" || props.card == "PRINCE"))
        {
            playState = (
                <Ons.Card>
                    <div className="cardPlayButtonDiv">
                        Must play <CardName card={"COUNTESS"} />
                    </div>
                </Ons.Card>
            );
        }
        else
        {
            playState = (
                <Ons.Card>
                    <div className="cardPlayButtonDiv">
                        <Ons.Button onClick={handlePlayCardClick}>Play</Ons.Button>
                    </div>
                </Ons.Card>
            );
        }
    }
    else if (props.cardPlayState.state == "PLAYED")
    {
        var anyValidTargets = true;
        var targetList = props.playerDetails.map(function(playerDetails, index)
            {
                anyValidTargets = anyValidTargets && playerDetails.state == "ALIVE";
                return ((props.playerId == index) ? null :
                    <Ons.ListItem key={playerDetails.name}>
                        <PlayerLine playerDetails={playerDetails} hasDropdown={false}>
                            {
                                playerDetails.state != "ALIVE" ?
                                    (<span className="playerName">{playerDetails.name}</span>) :
                                    (<Ons.Button onClick={(e) => handlePickTargetClick(index, e)} >{playerDetails.name}</Ons.Button>)
                            }
                        </PlayerLine>
                    </Ons.ListItem>
                );
            }
        );

        playState = (
            <React.Fragment>
                <Ons.Card>
                    <div className="interactionText">
                        Pick a target
                    </div>
                </Ons.Card>
                <Ons.Card>
                    <Ons.List>
                        {targetList}
                        {anyValidTargets ? null :
                            <Ons.ListItem>
                                <div className="center">
                                    <Ons.Button onClick={handleNoValidTargetClick}>No valid target</Ons.Button>
                                </div>
                            </Ons.ListItem>
                        }
                    </Ons.List>
                    <div className="cardPlayButtonDiv">
                        <Ons.Button onClick={handleBackClick}>Back</Ons.Button>
                    </div>
                </Ons.Card>
            </React.Fragment>
        );
    }
    else if (props.cardPlayState.state == "GUESS")
    {
        var targetPlayerDetails = props.playerDetails[props.cardPlayState.target];
        playState = (
            <React.Fragment>
                <Ons.Card>
                    <div className="interactionText">
                        Guess what card <PlayerCharacterName playerDetails={targetPlayerDetails} /> has
                    </div>
                </Ons.Card>
                <Ons.Card>
                    <Ons.List>
                        <Ons.ListItem>
                            <div className="right">
                                (# Played / # In Deck)
                            </div>
                        </Ons.ListItem>
                        {
                            orderedCards.map((cardType, index) =>
                                (cardType == "GUARD") ? null :
                                <Ons.ListItem key={index}>
                                    <CardName card={cardType} />
                                    <div className="right">
                                        <Ons.Button onClick={(e) => handlePickGuessClick(cardType, e)}>Pick ({props.discardedCardTotals[index]} / {cardDetailsMap[cardType].numInDeck})</Ons.Button>
                                    </div>
                                </Ons.ListItem>
                            )
                        }
                        <div className="cardPlayButtonDiv">
                            <Ons.Button onClick={handleBackClick}>Back</Ons.Button>
                        </div>
                    </Ons.List>
                </Ons.Card>
            </React.Fragment>
        );
    }

    return (
        <Ons.CarouselItem>
            <Ons.Card>
                <CardImgAndDetails card={props.card} />
            </Ons.Card>
            {playState}
            <div className="swipeHack">
            </div>
        </Ons.CarouselItem>
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
                {
                    props.hasDropdown ?
                        <span className="list-item__expand-chevron"></span>
                        : null
                }
            </div>
        </React.Fragment>
    );
}

function OptionalDropdownListItem(props)
{
    if (props.hasDropdown)
    {
        return (
            <Ons.ListItem expandable>
                {props.children}
            </Ons.ListItem>
        );
    }
    else
    {
        return (
            <Ons.ListItem>
                {props.children}
            </Ons.ListItem>
        );
    }
}

function PlayersList(props)
{
    return props.playerDetails.map((playerDetails, index) =>
        <OptionalDropdownListItem hasDropdown={playerDetails.discarded.length > 0} key={playerDetails.name}>
            <PlayerLine playerDetails={playerDetails} hasDropdown={playerDetails.discarded.length > 0}>
                <span className="playerName">{playerDetails.name}</span>
            </PlayerLine>
            {
                playerDetails.discarded.length == 0 ? null :
                    <div className="expandable-content">
                        <div>Last played:</div>
                        <DiscardList cards={playerDetails.discarded} />
                    </div>
            }
        </OptionalDropdownListItem>
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
                <Ons.Button onClick={handleStart}>Start Game</Ons.Button>
            </InteractionCard>
        );
    }
    else
    {
        return (
            <Ons.Card>
                <div className="interactionText">
                    Waiting for game to start
                </div>
                <div className="interactionDots">
                    <DotDotDot />
                </div>
            </Ons.Card>
        );
    }
}

function TopLine(props)
{
    var i;
    var totalDiscards = 0;
    for (i = 0; i < props.discardedCardTotals.length; i += 1)
    {
        totalDiscards += props.discardedCardTotals[i];
    }
    var cardsLeft = cardTypes.length - 1 - totalDiscards;
    if (cardsLeft < 5)
    {
        return (
            <Ons.Card>
                <div className="cardsLeft">
                    {cardsLeft} cards left{cardsLeft <= 2 ? "!" : "..."}
                </div>
            </Ons.Card>
        );
    }
    else
    {
        return null;
    }
}

function GameCarouselItems(props)
{
    var card1 = null;
    if (props.cards.length > 1)
    {
        card1 = <GameCardItem
            card={props.cards[1]}
            handCardId={1}
            otherCard={props.cards[0]}
            playerId={props.playerId}
            playerDetails={props.playerDetails}
            cardPlayState={props.cardPlayState}
            discardedCardTotals={props.discardedCardTotals} />;
    }

    return (
        <Ons.Carousel id="gameCarousel" fullscreen swipeable auto-scroll auto-scroll-ratio="0.1">
            <Ons.CarouselItem>
                <TopLine discardedCardTotals={props.discardedCardTotals} />
                <Ons.Card>
                    <PlayersList playerDetails={props.playerDetails} tokenList={props.tokenList} />
                </Ons.Card>
                <StartGameCard gameState={props.gameState} playerId={props.playerId} />
                <div className="swipeHack">
                </div>
            </Ons.CarouselItem>
            {
                props.cards.length == 0 ? null :
                    <React.Fragment>
                        <GameCardItem
                            card={props.cards[0]}
                            handCardId={0}
                            otherCard={props.cards[1]}
                            playerId={props.playerId}
                            playerDetails={props.playerDetails}
                            cardPlayState={props.cardPlayState}
                            discardedCardTotals={props.discardedCardTotals} />
                        {card1}
                    </React.Fragment>
            }
        </Ons.Carousel>
    );
}

function GameTopBar(props)
{
    function handleClick(handId)
    {
        app.gotoCard(handId);
    }

    var cardsList = null;
    if (props.cards.length > 0)
    {
        var card1 = null;
        if (props.cards.length > 1)
        {
            card1 = <span onClick={(e) => handleClick(1, e)}>, <CardName card={props.cards[1]} onClick={(e) => handleClick(1, e)} /></span>;
        }
        return (<span>
            <span onClick={(e) => handleClick(0, e)}><CardName card={props.cards[0]}/></span>
            {card1}
        </span>);
    }
    return null;
}

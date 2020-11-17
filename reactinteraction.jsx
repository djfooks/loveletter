
function InteractionCard(props)
{
    return (
        <ons-card>
            <div className="interactionText">
                {props.children}
            </div>
        </ons-card>
    );
}

function PlayerDiscard(props)
{
    return (
        <React.Fragment>
            <InteractionCard>
                <PlayerCharacterName playerDetails={props.playerDetails} /> discarded
            </InteractionCard>
            <ons-card>
                <CardImgAndDetails card={props.card} />
            </ons-card>
        </React.Fragment>
    );
}

function PlayerEliminated(props)
{
    return (
        <InteractionCard>
            <PlayerCharacterName playerDetails={props.playerDetails} /> has been eliminated!
            <PlayerState state="DEAD" />
        </InteractionCard>
    );
}

function SecretReveal(props)
{
    return (
        <React.Fragment>
            <InteractionCard>
                <PlayerCharacterName playerDetails={props.playerDetails} /> secretly reveals
            </InteractionCard>
            <ons-card>
                <CardImgAndDetails card={props.card} />
            </ons-card>
        </React.Fragment>
    );
}

function InteractionPageContent(props)
{
    var turnPlayerDetails = props.playerDetails[props.playerTurn];
    var targetPlayerDetails = props.playerDetails[props.playerTarget];

    var interaction = null;
    var waitingText = '';
    if (props.playedCard == "GUARD")
    {
        interaction = (
                <InteractionCard>
                    To target <PlayerCharacterName playerDetails={targetPlayerDetails} />
                    and guessed<span className="hspacer"></span><CardName card={props.guessed} />
                </InteractionCard>
            );
        waitingText = "Waiting for the big reveal";
    }
    else if (props.playedCard == "PRIEST" ||
             props.playedCard == "BARON" ||
             props.playedCard == "PRINCE" ||
             props.playedCard == "KING")
    {
        interaction = (
                <InteractionCard>
                    To target <PlayerCharacterName playerDetails={targetPlayerDetails} />
                </InteractionCard>
            );
        waitingText = "Waiting for the big reveal";
    }
    else if (props.playedCard == "PRINCESS")
    {
        interaction = (
                <PlayerEliminated playerDetails={turnPlayerDetails} />
            );
    }

    var otherDetails = null;
    if (props.interactionStatus == "REVEAL" && props.playerTarget == props.playerId)
    {
        // TODO these states!
        otherDetails = (
                <InteractionCard>
                    <ons-button>Reveal</ons-button>
                </InteractionCard>
            );
    }
    else if (props.interactionStatus == "CONTINUE")
    {
        var endTurn;
        if (props.playerTurn == props.playerId)
        {
            endTurn = (
                <InteractionCard>
                    <ons-button>End Turn</ons-button>
                </InteractionCard>
            );
        }
        else
        {
            endTurn = (
                <ons-card>
                    <div className="interactionText">
                        Waiting for turn to end
                    </div>
                    <div className="interactionDots">
                        <DotDotDot />
                    </div>
                </ons-card>
            );
        }

        if (props.playedCard == "GUARD")
        {
            if (props.result == "CORRECT_GUESS")
            {
                otherDetails = (
                    <React.Fragment>
                        <PlayerDiscard playerDetails={targetPlayerDetails} card={props.guessed}/>
                        <PlayerEliminated playerDetails={targetPlayerDetails} />
                        {endTurn}
                    </React.Fragment>
                );
            }
            else
            {
                otherDetails = (
                    <React.Fragment>
                        <InteractionCard>
                            The guess was incorrect
                        </InteractionCard>
                        {endTurn}
                    </React.Fragment>
                );
            }
        }
        else if (props.playedCard == "PRIEST")
        {
            if (props.playerTurn == props.playerId || props.playerTarget == props.playerId)
            {
                otherDetails = (
                    <React.Fragment>
                        <SecretReveal playerDetails={targetPlayerDetails} card={props.guessed} />
                        {endTurn}
                    </React.Fragment>
                );
            }
            else
            {
                otherDetails = (
                    <React.Fragment>
                        <InteractionCard>
                            <PlayerCharacterName playerDetails={targetPlayerDetails} /> has secretly revealed their card
                        </InteractionCard>
                        {endTurn}
                    </React.Fragment>
                );
            }
        }
        else if (props.playedCard == "BARON")
        {
            var winner = props.loser == props.playerTurn ? props.playerTarget : props.playerTurn;
            var winnerPlayerDetails = props.playerDetails[winner];
            var loserPlayerDetails = props.playerDetails[props.loser];

            if (props.playerTurn == props.playerId || props.playerTarget == props.playerId)
            {
                if (props.result == "TIE")
                {
                    otherDetails = (
                        <React.Fragment>
                            <SecretReveal playerDetails={turnPlayerDetails} card={props.revealedCard} />
                            <SecretReveal playerDetails={targetPlayerDetails} card={props.revealedCard} />
                            <InteractionCard>
                                Its a tie! (nothing happens)
                            </InteractionCard>
                        </React.Fragment>
                    );
                }
                else
                {
                    var turnPlayerCard = props.playerId == props.playerTurn ? props.otherCard : props.revealedCard;
                    var targetPlayerCard = props.playerId == props.playerTarget ? props.otherCard : props.revealedCard;
                    otherDetails = (
                        <React.Fragment>
                            <SecretReveal playerDetails={turnPlayerDetails} card={turnPlayerCard} />
                            <SecretReveal playerDetails={targetPlayerDetails} card={targetPlayerCard} />
                            <InteractionCard>
                                <PlayerCharacterName playerDetails={winnerPlayerDetails} /> wins!
                            </InteractionCard>
                            <PlayerEliminated playerDetails={loserPlayerDetails} />
                        </React.Fragment>
                    );
                }
            }
            else
            {
                if (props.result == "TIE")
                {
                    otherDetails = (
                        <InteractionCard>
                            Its a tie! (nothing happens)
                        </InteractionCard>
                    );
                }
                else
                {
                    otherDetails = (
                        <React.Fragment>
                            <InteractionCard>
                                <PlayerCharacterName playerDetails={winnerPlayerDetails} /> wins!
                            </InteractionCard>
                            <PlayerDiscard playerDetails={loserPlayerDetails} card={props.discarded}/>
                            <PlayerEliminatedDiscard playerDetails={loserPlayerDetails} />
                        </React.Fragment>
                    );
                }
            }
        }
    }
    else
    {
        otherDetails = (
            <ons-card>
                <div className="interactionText">
                    {waitingText}
                </div>
                <div className="interactionDots">
                    <DotDotDot />
                </div>
            </ons-card>
        );
    }

    return (
        <React.Fragment>
            <ons-card>
                <div className="interactionText">
                    <PlayerCharacterName playerDetails={turnPlayerDetails} /> played
                </div>
            </ons-card>

            <ons-card>
                <CardImgAndDetails card={props.playedCard} />
            </ons-card>

            {interaction}
            {otherDetails}
        </React.Fragment>
    );
}


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
                    To target <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span>
                    and guessed<span style={{"padding": "3px"}}></span><CardName card={props.guessed} />
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
                    To target <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span>
                </InteractionCard>
            );
        waitingText = "Waiting for the big reveal";
    }
    else if (props.playedCard == "PRINCESS")
    {
        interaction = (
                <InteractionCard>
                    <PlayerCharacter playerDetails={turnPlayerDetails} /><span className="playerName">{turnPlayerDetails.name}</span> has been eliminated!
                </InteractionCard>
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
                        <InteractionCard>
                            <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span> discarded
                        </InteractionCard>
                        <ons-card>
                            <CardImgAndDetails card={props.guessed} />
                        </ons-card>
                        <InteractionCard>
                            <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span> has been eliminated!
                            <PlayerState state="DEAD" />
                        </InteractionCard>
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
                        <InteractionCard>
                            <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span> secretly reveals
                        </InteractionCard>
                        <ons-card>
                            <CardImgAndDetails card={props.guessed} />
                        </ons-card>
                        {endTurn}
                    </React.Fragment>
                );
            }
            else
            {
                otherDetails = (
                    <React.Fragment>
                        <InteractionCard>
                            <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span> has secretly revealed their card
                        </InteractionCard>
                        {endTurn}
                    </React.Fragment>
                );
            }
        }
        else if (props.playedCard == "BARON")
        {
            // TODO
            /*var targetCard;
            var resultString;
            if ()
            {
                header = (
                    <InteractionCard>
                        <PlayerCharacter playerDetails={turnPlayerDetails} /><span className="playerName">{turnPlayerDetails.name}</span> secretly reveals
                    </InteractionCard>
                    <ons-card>
                        <CardImgAndDetails card={props.playedCard} />
                    </ons-card>
                );
            }

            if (props.result == "TIE")
            {

                otherDetails = (
                    <React.Fragment>
                        <InteractionCard>
                            <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span> secretly reveals
                        </InteractionCard>
                        <ons-card>
                            <CardImgAndDetails card={props.playedCard} />
                        </ons-card>
                        <InteractionCard>
                            Its a tie! (nothing happens)
                        </InteractionCard>
                        {endTurn}
                    </React.Fragment>
                );
            }*/
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
                    <PlayerCharacter playerDetails={turnPlayerDetails} /><span className="playerName">{turnPlayerDetails.name}</span> played
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

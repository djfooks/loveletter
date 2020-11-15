
function InteractionPageContent(props)
{
    var turnPlayerDetails = props.playerDetails[props.playerTurn];
    var targetPlayerDetails = props.playerDetails[props.playerTarget];
    return (
        <ons-card>
            <div className="interactionText">
                <PlayerCharacter playerDetails={turnPlayerDetails} /><span className="playerName">{turnPlayerDetails.name}</span> played
            </div>
            <CardImgAndDetails card={props.playedCard} />

            <div className="interactionText">
                To target <PlayerCharacter playerDetails={targetPlayerDetails} /><span className="playerName">{targetPlayerDetails.name}</span>
                and guessed<span style={{"padding": "3px"}}></span><CardName card={props.guessed} />
            </div>

            <br />
            <div className="interactionText">
                Waiting for the big reveal
            </div>
            <div className="interactionText">
                <DotDotDot />
            </div>
        </ons-card>
    );
}

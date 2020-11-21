
function RoundEndPlayersListItem(props)
{
    return (
        <React.Fragment>
            <PlayerCharacterName playerDetails={props.playerDetails} />
            {
                props.playerDetails.state == "DEAD" ?
                    <div className="right">
                        <PlayerState state="DEAD" />
                    </div>
                :
                    <div className="right">
                        <span className="hspacer"></span><CardName card={props.finalCard}/>
                    </div>
            }
        </React.Fragment>
    );
}

function RoundEndPlayersList(props)
{
    return props.playerDetails.map((playerDetails, index) =>
        <ons-list-item key={index}>
            <RoundEndPlayersListItem finalCard={props.finalCards[index]} playerDetails={playerDetails}/>
        </ons-list-item>
    );
}

function WinnersCards(props)
{
    return props.winnerIds.map((id, index) =>
        <ons-card key={id}>
            <ons-list-item>
                <PlayerCharacterName playerDetails={props.playerDetails[id]} /> wins the round!
                <div className="right">
                    <ons-button>New round</ons-button>
                </div>
            </ons-list-item>
        </ons-card>
    );
}

function RoundEndPageContent(props)
{
    return (
        <React.Fragment>
            <ons-card>
                <ons-list>
                    <RoundEndPlayersList finalCards={props.finalCards} playerDetails={props.playerDetails}/>
                </ons-list>
            </ons-card>
            <WinnersCards playerDetails={props.playerDetails} winnerIds={props.winnerIds}/>
        </React.Fragment>
    );
}

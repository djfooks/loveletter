
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
        <Ons.ListItem key={index}>
            <RoundEndPlayersListItem finalCard={props.finalCards[index]} playerDetails={playerDetails}/>
        </Ons.ListItem>
    );
}

function WinnersCards(props)
{
    return props.winnerIds.map((id, index) =>
        <Ons.Card key={id}>
            <Ons.ListItem>
                <PlayerCharacterName playerDetails={props.playerDetails[id]} /> wins the round!
                <div className="right">
                    <Ons.Button>New round</Ons.Button>
                </div>
            </Ons.ListItem>
        </Ons.Card>
    );
}

function RoundEndPageContent(props)
{
    return (
        <React.Fragment>
            <Ons.Card>
                <Ons.List>
                    <RoundEndPlayersList finalCards={props.finalCards} playerDetails={props.playerDetails}/>
                </Ons.List>
            </Ons.Card>
            <WinnersCards playerDetails={props.playerDetails} winnerIds={props.winnerIds}/>
        </React.Fragment>
    );
}

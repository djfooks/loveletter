import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonList, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { CardType, tokensToWinMap } from '../cards';
import { clientApp } from '../ClientApp';
import { CardName, Interaction, InteractionCard, PlayerCharacterName, PlayerDetails, PlayerState } from '../Shared';
import { LVListenerList } from '../UIListeners';
import { Tokens } from './GamePage';
import './Page.css';

function RoundEndPlayersListItem(props : {playerDetails : PlayerDetails, finalCard : CardType | null})
{
    return (
        <div className="roundEndPlayerLine">
            <div className="alignLeft">
                <PlayerCharacterName playerDetails={props.playerDetails} />
            </div>
            {
                props.playerDetails.state === "DEAD" ?
                    <div className="roundEndPlayerStatus">
                        <span className="middlerHack"></span>
                        <PlayerState status="DEAD" />
                    </div>
                : (!props.finalCard ? null :
                    <div className="alignRight">
                        <span className="middlerHack"></span>
                        <span className="hspacer"></span><CardName card={props.finalCard!}/>
                    </div>)
            }
        </div>
    );
}

function RoundEndPlayersList(props : {playerDetails : PlayerDetails[], finalCards : CardType[]})
{
    return (<>
        {
            props.playerDetails.map((playerDetails, index) =>
            <IonItem key={index}>
                <RoundEndPlayersListItem finalCard={props.finalCards.length > 0 ? props.finalCards[index] : null} playerDetails={playerDetails}/>
            </IonItem>)
        }
        </>
    );
}

function WinnersCards(props : {playerDetails: PlayerDetails[], winnerIds: number[], playerId: number, gameWinner?: number, roomSeed: number})
{
    if (props.gameWinner !== undefined)
    {
        return (
            <>
                <InteractionCard>
                    <PlayerCharacterName playerDetails={props.playerDetails[props.gameWinner]} /> wins the game!
                </InteractionCard>
                <InteractionCard>
                    <Tokens wins={props.playerDetails[props.gameWinner].wins} seed={props.roomSeed + props.gameWinner! * 10} />
                </InteractionCard>
            </>
        );
    }

    function handleNewRound()
    {
        clientApp.interactionStep();
    }

    return (
        <>
        {
            props.winnerIds.map((id, index) =>
                <React.Fragment key={id}>
                    <InteractionCard>
                        <PlayerCharacterName playerDetails={props.playerDetails[id]} /> wins the round!
                    </InteractionCard>
                    <InteractionCard>
                        <Tokens wins={props.playerDetails[id].wins} seed={props.roomSeed + id * 10} />
                        <br></br>
                        {tokensToWinMap[props.playerDetails.length] - props.playerDetails[id].wins} more tokens needed to win
                    </InteractionCard>
                    { props.playerId === id ?
                        <InteractionCard>
                            <IonButton onClick={handleNewRound}>New round</IonButton>
                        </InteractionCard> : null
                    }
                </React.Fragment>
            )
        }
        </>
    );
}

const RoundCompletePage: React.FC = () => {

    const [playerDetails, setPlayerDetails] = useState<PlayerDetails[]>(clientApp.getUiProperty("playerDetails"));
    const [playerId, setPlayerId] = useState<number>(clientApp.getUiProperty("playerId"));
    const [interaction, setInteraction] = useState<Interaction>(clientApp.getUiProperty("interaction"));
    const [roomSeed, setRoomSeed] = useState<number>(clientApp.getUiProperty("roomSeed"));

    useEffect(() => {
        var listeners = new LVListenerList("roundComplete");
        listeners.onPropertyChange("playerDetails", function(value : PlayerDetails[]) { setPlayerDetails(value); });
        listeners.onPropertyChange("playerId", function(value : number) { setPlayerId(value); });
        listeners.onPropertyChange("interaction", function(value : Interaction) { setInteraction(value); });
        listeners.onPropertyChange("roomSeed", function(value : number) { setRoomSeed(value); });
        return clientApp.effectListeners(listeners);
    }, []);

    return (
        <IonPage>
            <IonContent fullscreen>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonMenuButton />
                        </IonButtons>
                        <IonTitle>Round Complete</IonTitle>
                    </IonToolbar>
                </IonHeader>

                { interaction.status !== "ROUND_COMPLETE" ? null :
                    <>
                        <InteractionCard>
                            <IonList>
                                <RoundEndPlayersList finalCards={interaction.finalCards || []} playerDetails={playerDetails}/>
                            </IonList>
                        </InteractionCard>
                        <WinnersCards playerId={playerId} playerDetails={playerDetails} winnerIds={interaction.winnerIds || []} gameWinner={interaction.gameWinner} roomSeed={roomSeed}/>
                    </>
                }
            </IonContent>
        </IonPage>
    );
}

export default RoundCompletePage;
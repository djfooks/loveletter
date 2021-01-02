import { IonButton, IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { CardType } from '../cards';
import { clientApp } from '../ClientApp';
import { CardImgAndDetails, CardName, DotDotDot, Interaction, InteractionCard, LVCard, PlayerCharacterName, PlayerDetails, PlayerState } from '../Shared';
import { LVListenerList } from '../UIListeners';
import './Page.css';

function PlayerDiscard(props : { playerDetails : PlayerDetails, card : CardType })
{
    return (
        <React.Fragment>
            <InteractionCard>
                <PlayerCharacterName playerDetails={props.playerDetails} /> discarded
            </InteractionCard>
            <LVCard>
                <CardImgAndDetails card={props.card} />
            </LVCard>
        </React.Fragment>
    );
}

function PlayerEliminated(props : { playerDetails : PlayerDetails })
{
    return (
        <InteractionCard>
            <PlayerCharacterName playerDetails={props.playerDetails} /> has been eliminated!
            <PlayerState status="DEAD" />
        </InteractionCard>
    );
}

function SecretReveal(props : { playerDetails : PlayerDetails, card : CardType })
{
    return (
        <React.Fragment>
            <InteractionCard>
                <PlayerCharacterName playerDetails={props.playerDetails} /> secretly reveals
            </InteractionCard>
            <LVCard>
                <CardImgAndDetails card={props.card} />
            </LVCard>
        </React.Fragment>
    );
}

function InteractionContent()
{
    const [playerDetails, setPlayerDetails] = useState<PlayerDetails[]>(clientApp.getUiProperty("playerDetails"));
    const [playerId, setPlayerId] = useState<number>(clientApp.getUiProperty("playerId"));
    const [turnId, setTurnId] = useState<number>(clientApp.getUiProperty("turnId"));
    const [interaction, setInteraction] = useState<Interaction>(clientApp.getUiProperty("interaction"));

    useEffect(() => {
        var listeners = new LVListenerList("interaction");
        listeners.onPropertyChange("playerDetails", function(value : PlayerDetails[]) { setPlayerDetails(value); });
        listeners.onPropertyChange("playerId", function(value : number) { setPlayerId(value); });
        listeners.onPropertyChange("turnId", function(value : number) { setTurnId(value); });
        listeners.onPropertyChange("interaction", function(value : Interaction) { setInteraction(value); });
        return clientApp.effectListeners(listeners);
    }, []);

    if (interaction.status !== "REVEAL" && interaction.status !== "CONTINUE")
    {
        if (playerDetails !== undefined && turnId !== undefined && turnId >= 0 && turnId < playerDetails.length)
        {
            return <InteractionCard>Waiting for <PlayerCharacterName playerDetails={playerDetails[turnId]!} /></InteractionCard>;
        }
        else
        {
            return <InteractionCard>Waiting for something to happen...</InteractionCard>;
        }
    }

    var turnPlayerDetails = playerDetails[interaction.playerId];
    var targetPlayerDetails : PlayerDetails | null = null;
    var hasTarget : boolean = interaction.targetId !== undefined && interaction.targetId !== -1;
    if (hasTarget)
    {
        targetPlayerDetails = playerDetails[interaction.targetId!];
    }

    function handleEndTurn()
    {
        clientApp.interactionStep();
    }

    function handleReveal()
    {
        clientApp.interactionStep();
    }

    var interactionBlock;
    var waitingText = '';

    if (interaction.playedCard === "GUARD")
    {
        if (hasTarget)
        {
            interactionBlock = (
                <InteractionCard>
                    To target <PlayerCharacterName playerDetails={targetPlayerDetails!} />
                    and guessed<span className="hspacer"></span><CardName card={interaction.guess!} />
                </InteractionCard>
            );
            waitingText = "Waiting for the big reveal";
        }
        else
        {
            interactionBlock = (
                <InteractionCard>
                    But there is nobody to target
                </InteractionCard>
            );
        }
    }
    else if (interaction.playedCard === "PRIEST" ||
             interaction.playedCard === "BARON" ||
             interaction.playedCard === "PRINCE" ||
             interaction.playedCard === "KING")
    {
        if (hasTarget)
        {
            interactionBlock = (
                <InteractionCard>
                    To target <PlayerCharacterName playerDetails={targetPlayerDetails!} />
                </InteractionCard>
            );
            waitingText = "Waiting for the big reveal";
        }
        else
        {
            interactionBlock = (
                <InteractionCard>
                    But there is nobody to target
                </InteractionCard>
            );
        }
    }
    else if (interaction.playedCard === "PRINCESS")
    {
        interactionBlock = (
            <PlayerEliminated playerDetails={turnPlayerDetails} />
        );
    }

    var endTurn = null;
    var otherDetails = null;
    if (interaction.status === "REVEAL" && interaction.targetId === playerId)
    {
        // TODO these states!
        otherDetails = (
            <InteractionCard>
                <IonButton onClick={handleReveal}>Reveal</IonButton>
            </InteractionCard>
        );
    }
    else if (interaction.status === "CONTINUE")
    {
        if (interaction.playerId === playerId)
        {
            endTurn = (
                <InteractionCard>
                    <IonButton onClick={handleEndTurn}>End Turn</IonButton>
                </InteractionCard>
            );
        }
        else
        {
            endTurn = (
                <LVCard>
                    <div className="interactionText">
                        Waiting for turn to end
                    </div>
                    <div className="interactionDots">
                        <DotDotDot />
                    </div>
                </LVCard>
            );
        }

        if (interaction.playedCard === "GUARD" && hasTarget)
        {
            if (interaction.result === "CORRECT_GUESS")
            {
                otherDetails = (
                    <React.Fragment>
                        <PlayerDiscard playerDetails={targetPlayerDetails!} card={interaction.guess!} />
                        <PlayerEliminated playerDetails={targetPlayerDetails!} />
                    </React.Fragment>
                );
            }
            else
            {
                otherDetails = (
                    <InteractionCard>
                        The guess was incorrect
                    </InteractionCard>
                );
            }
        }
        else if (interaction.playedCard === "PRIEST" && hasTarget)
        {
            if (interaction.playerId === playerId || interaction.targetId === playerId)
            {
                otherDetails = (
                    <React.Fragment>
                        <SecretReveal playerDetails={targetPlayerDetails!} card={interaction.revealedCard!} />
                    </React.Fragment>
                );
            }
            else
            {
                otherDetails = (
                    <React.Fragment>
                        <InteractionCard>
                            <PlayerCharacterName playerDetails={targetPlayerDetails!} /> has secretly revealed their card
                        </InteractionCard>
                    </React.Fragment>
                );
            }
        }
        else if (interaction.playedCard === "BARON" && hasTarget)
        {
            var winner : number = interaction.loserId === interaction.playerId ? interaction.targetId! : interaction.playerId;
            var winnerPlayerDetails = playerDetails[winner];
            var loserPlayerDetails = playerDetails[interaction.loserId!];

            if (interaction.playerId === playerId || interaction.targetId === playerId)
            {
                if (interaction.result === "TIE")
                {
                    otherDetails = (
                        <React.Fragment>
                            <SecretReveal playerDetails={turnPlayerDetails} card={interaction.revealedCard!} />
                            <SecretReveal playerDetails={targetPlayerDetails!} card={interaction.revealedCard!} />
                            <InteractionCard>
                                Its a tie! (nothing happens)
                            </InteractionCard>
                        </React.Fragment>
                    );
                }
                else
                {
                    var baronTurnPlayerCard : CardType = playerId === interaction.playerId ? interaction.otherCard! : interaction.revealedCard!;
                    var baronTargetPlayerCard : CardType = playerId === interaction.targetId ? interaction.otherCard! : interaction.revealedCard!;
                    otherDetails = (
                        <React.Fragment>
                            <SecretReveal playerDetails={turnPlayerDetails} card={baronTurnPlayerCard} />
                            <SecretReveal playerDetails={targetPlayerDetails!} card={baronTargetPlayerCard} />
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
                if (interaction.result === "TIE")
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
                            <PlayerDiscard playerDetails={loserPlayerDetails} card={interaction.discard!} />
                            <PlayerEliminated playerDetails={loserPlayerDetails} />
                        </React.Fragment>
                    );
                }
            }
        }
        else if (interaction.playedCard === "PRINCE" && hasTarget)
        {
            otherDetails = (
                <React.Fragment>
                    <PlayerDiscard playerDetails={targetPlayerDetails!} card={interaction.revealedCard!} />
                    {
                        interaction.revealedCard !== "PRINCESS" ? null :
                        <PlayerEliminated playerDetails={targetPlayerDetails!} />
                    }
                </React.Fragment>
            );
        }
        else if (interaction.playedCard === "KING" && hasTarget)
        {
            if (interaction.playerId === playerId || interaction.targetId === playerId)
            {
                var kingTurnPlayerCard : CardType = playerId === interaction.playerId ? interaction.otherCard! : interaction.swappedFor!;
                var kingTargetPlayerCard : CardType = playerId === interaction.targetId ? interaction.prevCard! : interaction.swappedFor!;
                otherDetails = (
                    <React.Fragment>
                        <SecretReveal playerDetails={turnPlayerDetails} card={kingTurnPlayerCard} />
                        <SecretReveal playerDetails={targetPlayerDetails!} card={kingTargetPlayerCard} />
                        <InteractionCard>
                            <PlayerCharacterName playerDetails={turnPlayerDetails} /> now has <span className="hspacer"></span><CardName card={kingTargetPlayerCard}/>
                        </InteractionCard>
                        <InteractionCard>
                            <PlayerCharacterName playerDetails={targetPlayerDetails!} /> now has <span className="hspacer"></span><CardName card={kingTurnPlayerCard}/>
                        </InteractionCard>
                    </React.Fragment>
                );
            }
        }
    }
    else
    {
        otherDetails = (
            <LVCard>
                <div className="interactionText">
                    {waitingText}
                </div>
                <div className="interactionDots">
                    <DotDotDot />
                </div>
            </LVCard>
        );
    }

    return (
        <>
            <LVCard>
                <div className="interactionText">
                    <PlayerCharacterName playerDetails={turnPlayerDetails} /> played
                </div>
            </LVCard>

            <LVCard>
                <CardImgAndDetails card={interaction.playedCard} />
            </LVCard>

            {interactionBlock}
            {otherDetails}
            {endTurn}

            <div className="scrollHack"></div>
        </>
    );
}


const InteractionPage: React.FC = () => {
    return (
        <IonPage>
            <IonContent fullscreen>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonMenuButton />
                        </IonButtons>
                        <IonTitle>Action</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <InteractionContent />
            </IonContent>
        </IonPage>
    );
}

export default InteractionPage;
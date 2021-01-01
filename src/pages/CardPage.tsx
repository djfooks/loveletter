import {
    IonButton,
    IonButtons,
    IonContent, 
    IonHeader,
    IonItem,
    IonList,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { CardType, getCardDetails, orderedCards } from '../cards';
import { CardImgAndDetails, CardName, LVCard, PlayerCharacter, PlayerCharacterName, PlayerDetails, PlayerState } from '../Shared';
import './Page.css';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';

function PlayCard(props : {playerDetails : PlayerDetails[], playerId : number, handId: number, card : CardType, otherCard : CardType, discardedCardTotals: number[]})
{
    type PlayCardState = "" | "PICK_TARGET" | "PICK_GUESS";

    const [playState, setPlayState] = useState<PlayCardState>("");
    const [pickedTarget, setPickedTarget] = useState<number>(-1);
    const [waiting, setWaiting] = useState<boolean>(false);

    function handlePlayCardClick()
    {
        var card = props.card;
        if (card === "GUARD" ||
            card === "PRIEST" ||
            card === "BARON" ||
            card === "PRINCE" ||
            card === "KING")
        {
            setPlayState("PICK_TARGET");
        }
        else
        {
            clientApp.playCard(props.handId);
            setWaiting(true);
        }
    }

    function handlePickTargetClick(targetId : number)
    {
        var card = props.card;
        if (card === "GUARD")
        {
            setPickedTarget(targetId);
            setPlayState("PICK_GUESS");
        }
        else
        {
            clientApp.playCard(props.handId, targetId);
            setWaiting(true);
        }
    }

    function handleNoValidTargetClick()
    {
        clientApp.playCard(props.handId, -1);
        setWaiting(true);
    }

    function handlePickGuessClick(guessCardType : CardType)
    {
        clientApp.playCard(props.handId, pickedTarget, guessCardType);
        setWaiting(true);
    }

    function handleBackClick()
    {
        if (playState === "PICK_GUESS")
        {
            setPlayState("PICK_TARGET");
        }
        else if (playState === "PICK_TARGET")
        {
            setPlayState("");
        }
    }

    if (playState === "")
    {
        if (props.otherCard === "COUNTESS" && (props.card === "KING" || props.card === "PRINCE"))
        {
            return (
                <LVCard>
                    <div className="cardPlayButtonDiv">
                        Must play <CardName card={"COUNTESS"} />
                    </div>
                </LVCard>
            );
        }
        else
        {
            return (
                <LVCard>
                    <div className="cardPlayButtonDiv">
                        <IonButton onClick={handlePlayCardClick} disabled={waiting}>Play</IonButton>
                    </div>
                </LVCard>
            );
        }
    }
    else if (playState === "PICK_TARGET")
    {
        var anyValidTargets = false;
        var targetList = props.playerDetails.map(function(playerDetails, index)
            {
                if (props.playerId === index && props.card !== "PRINCE")
                    return null;

                anyValidTargets = anyValidTargets || playerDetails.state === "ALIVE";
                return (
                    <IonItem key={playerDetails.name}>
                        <div className="fullBox">
                            <div className="playerTopLine">
                                <span className="playerTopLineLeft">
                                    <PlayerCharacter playerDetails={playerDetails} />
                                    <span className="playerName">{playerDetails.name}</span>
                                    <PlayerState status={playerDetails.state} />
                                </span>
                                {
                                    playerDetails.state !== "ALIVE" ? null :
                                        <span className="playerTopLineRight">
                                            <IonButton className="verticalAlignMiddle" onClick={(e) => handlePickTargetClick(index)} disabled={waiting}>PICK</IonButton>
                                        </span>
                                }
                            </div>
                        </div>
                    </IonItem>
                );
            }
        );

        return (
            <React.Fragment>
                <LVCard>
                    <div className="interactionText">
                        Pick a target
                    </div>
                </LVCard>
                <LVCard>
                    <IonList>
                        {targetList}
                        {anyValidTargets ? null :
                            <IonItem>
                                <div className="center">
                                    <IonButton onClick={handleNoValidTargetClick} disabled={waiting}>No valid target</IonButton>
                                </div>
                            </IonItem>
                        }
                    </IonList>
                    <div className="cardPlayButtonDiv">
                        <IonButton onClick={handleBackClick}>Back</IonButton>
                    </div>
                </LVCard>
            </React.Fragment>
        );
    }
    else if (playState === "PICK_GUESS")
    {
        var targetPlayerDetails = props.playerDetails[pickedTarget];
        return (
            <React.Fragment>
                <LVCard>
                    <div className="interactionText">
                        Guess what card <PlayerCharacterName playerDetails={targetPlayerDetails} /> has
                    </div>
                </LVCard>
                <LVCard>
                    <IonList>
                        <IonItem>
                            <div className="fullBox">
                                <div className="cardOptionLine">
                                    <span className="cardOptionRight">
                                        (# Played / # In Deck)
                                    </span>
                                </div>
                            </div>
                        </IonItem>
                        {

                            orderedCards.map((cardType : CardType, index) =>
                                (cardType === "GUARD") ? null :
                                <IonItem key={index}>
                                    <div className="fullBox">
                                        <div className="cardOptionLine">
                                            <span className="cardOptionLeft">
                                                <CardName card={cardType} />
                                            </span>
                                            <span className="cardOptionRight">
                                                <IonButton disabled={waiting} className="verticalAlignMiddle" onClick={(e) => handlePickGuessClick(cardType)}>
                                                    Pick ({props.discardedCardTotals[index]} / {getCardDetails(cardType).numInDeck})
                                                </IonButton>
                                            </span>
                                        </div>
                                    </div>
                                </IonItem>
                            )
                        }
                        <div className="cardPlayButtonDiv">
                            <IonButton onClick={handleBackClick}>Back</IonButton>
                        </div>
                    </IonList>
                </LVCard>
            </React.Fragment>
        );
    }
    return null;
}

function CardPage(props: {handId: number})
{
    const [hand, setHand] = useState<CardType[]>(clientApp.getUiProperty("hand"));
    const [playerDetails, setPlayerDetails] = useState<PlayerDetails[]>(clientApp.getUiProperty("playerDetails"));
    const [playerId, setPlayerId] = useState<number>(clientApp.getUiProperty("playerId"));
    const [turnId, setTurnId] = useState<number>(clientApp.getUiProperty("turnId"));
    const [discardedCardTotals, setDiscardedCardTotals] = useState<number[]>(clientApp.getUiProperty("discardedCardTotals"));

    useEffect(() => {
        var listeners = new LVListenerList("card");
        listeners.onPropertyChange("hand", function(value : CardType[]) { setHand(value); });
        listeners.onPropertyChange("playerDetails", function(value : PlayerDetails[]) { setPlayerDetails(value); });
        listeners.onPropertyChange("discardedCardTotals", function(value : number[]) { setDiscardedCardTotals(value); });
        listeners.onPropertyChange("playerId", function(value : number) { setPlayerId(value); });
        listeners.onPropertyChange("turnId", function(value : number) { setTurnId(value); });
        return clientApp.effectListeners(listeners);
    }, []);

    var handId = props.handId;

    var content;
    var title;
    if (handId >= hand.length)
    {
        title = <>No card</>;
        content = null;
    }
    else
    {
        title = <CardName card={hand[handId]}></CardName>;
        content = (
        <>
            <LVCard>
            <CardImgAndDetails card={hand[handId]}/>
            </LVCard>
            {
                turnId !== playerId ? null :
                <PlayCard playerDetails={playerDetails} playerId={playerId} handId={handId} card={hand[handId]} otherCard={hand[handId === 0 ? 1 : 0]} discardedCardTotals={discardedCardTotals}></PlayCard>
            }
        </>);
    }

    return (
    <IonPage>
        <IonContent fullscreen>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>{title}</IonTitle>
                </IonToolbar>
            </IonHeader>
            {content}
        </IonContent>
    </IonPage>
    );
};

export default CardPage;
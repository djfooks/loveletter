import {
    IonButton,
    IonButtons, 
    IonCard, 
    IonContent, 
    IonHeader,
    IonItem,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar} from '@ionic/react';
import React from 'react';
import { cardTypes } from '../cards';
import { CardName, InteractionCard, PlayerCharacter, PlayerDetails, PlayerState, Token } from '../Shared';
import './Page.css';

function DiscardList(props : {cards: string[]})
{
    return (<>{props.cards.map((card, index) =>
            <div key={index}>
                <CardName card={card} />
            </div>
        )}</>);
}

function Tokens(props : {tokens: Token[]})
{
    return (
        <React.Fragment>
            {
                props.tokens.map((gem, index) =>
                    <img key={index} className="gemImg" style={ {"filter": "hue-rotate(180deg)"} } src="img/gem0.svg" alt="T"/>
                )
            }
        </React.Fragment>
    );
}

function PlayerLine(props : {playerDetails : PlayerDetails, children: any, hasDropdown: boolean})
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

function PlayersList(props : {playerDetails : PlayerDetails[]})
{
    return (<>{props.playerDetails.map((playerDetails, index) =>
        <IonItem key={playerDetails.name}>
            <PlayerLine playerDetails={playerDetails} hasDropdown={playerDetails.discarded.length > 0}>
                <span className="playerName">{playerDetails.name}</span>
            </PlayerLine>
            {
                playerDetails.discarded.length === 0 ? null :
                    <div className="expandable-content">
                        <div>Last played:</div>
                        <DiscardList cards={playerDetails.discarded} />
                    </div>
            }
        </IonItem>
    )}</>);
}

function StartGameCard(props : {gameState: string, playerId: number})
{
    function handleStart()
    {
        //app.start();
    }

    if (props.gameState !== "LOGIN")
        return null;

    if (props.playerId === 0)
    {
        return (
            <InteractionCard>
                <IonButton onClick={handleStart}>Start Game</IonButton>
            </InteractionCard>
        );
    }
    else
    {
        return (
            <IonCard>
                <div className="interactionText">
                    Waiting for game to start
                </div>
                <div className="interactionDots">
                    ...
                </div>
            </IonCard>
        );
    }
}

function TopLine(props : {discardedCardTotals : number[]})
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
            <IonCard>
                <div className="cardsLeft">
                    {cardsLeft} cards left{cardsLeft <= 2 ? "!" : "..."}
                </div>
            </IonCard>
        );
    }
    else
    {
        return null;
    }
}

const GamePage: React.FC = () => {

    var playerDetails : PlayerDetails[] = [
        { characterId: 1, discarded: ["GUARD"], name: "Dave", state: "ALIVE", tokens: [] }
    ];
    var discardedCardTotals : number[] = [0,0,0,0,0,0,0,0];
    var gameState = "LOGIN";
    var playerId = 0;

    return (
    <IonPage id="game">
        <IonContent fullscreen>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle></IonTitle>
                </IonToolbar>
            </IonHeader>
            <TopLine discardedCardTotals={discardedCardTotals} />
            <IonCard>
                <PlayersList playerDetails={playerDetails} />
            </IonCard>
            <StartGameCard gameState={gameState} playerId={playerId} />
        </IonContent>
    </IonPage>
    );
};

export default GamePage;
import {
    IonButton,
    IonButtons,
    IonContent, 
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { CardType, totalNumberOfCards } from '../cards';
import { CardName, DotDotDot, LVCard, InteractionCard, PlayerCharacter, PlayerDetails, PlayerState, Token, GameState } from '../Shared';
import './Page.css';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';

function DiscardList(props : {cards: CardType[]})
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

interface PlayerLineProps {
    playerDetails : PlayerDetails;
    hasDropdown: boolean;
}

interface PlayerLineState {
    "dropdownOpen": boolean;
}
export class PlayerLine extends React.Component<PlayerLineProps, PlayerLineState> {
    dropdownOpen : boolean;

    constructor(props : PlayerLineProps)
    {
        super(props);
        this.state = {"dropdownOpen": false};
        this.dropdownOpen = false;
    }

    render()
    {
        var that = this;
        function handleClick()
        {
            if (that.props.hasDropdown)
            {
                that.setState((state, props) => ({
                    dropdownOpen: !state.dropdownOpen
                }));
            }
        }

        return (
            <div onClick={handleClick} className="fullBox">
                <div className="playerTopLine">
                    <span className="playerTopLineLeft">
                        <PlayerCharacter playerDetails={this.props.playerDetails} />
                        <span className="playerName">{this.props.playerDetails.name}</span>
                        <PlayerState status={this.props.playerDetails.state} />
                    </span>
                    <span className="playerTopLineRight">
                        <Tokens tokens={this.props.playerDetails.tokens} />
                        <span className="gemPadding"></span>
                        {
                            this.props.playerDetails.discarded.length > 0 ?
                                <IonIcon icon={this.state.dropdownOpen ? chevronUpOutline : chevronDownOutline} className="verticalAlignMiddle"></IonIcon>
                                : null
                        }
                    </span>
                </div>
                <div>
                {
                    (this.props.playerDetails.discarded.length === 0 || !this.state.dropdownOpen) ? null :
                    <>
                        <div>Discarded:</div>
                        <DiscardList cards={this.props.playerDetails.discarded} />
                    </>
                }
                </div>
            </div>
        );
    }
}

function PlayersList(props : {playerDetails : PlayerDetails[]})
{
    return (<>{props.playerDetails.map((playerDetails, index) =>
        <LVCard key={playerDetails.name}>
            <PlayerLine playerDetails={playerDetails} hasDropdown={playerDetails.discarded.length > 0} />
        </LVCard>
    )}</>);
}

function StartGameCard(props : {gameState: GameState, playerId: number})
{
    function handleStart()
    {
        clientApp.start();
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
            <InteractionCard>
                <div className="interactionText">
                    Waiting for game to start
                </div>
                <div className="interactionDots">
                    <DotDotDot />
                </div>
            </InteractionCard>
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
    var cardsLeft = totalNumberOfCards - 1 - totalDiscards;
    if (cardsLeft < 5)
    {
        return (
            <LVCard>
                <div className="cardsLeft">
                    {cardsLeft} cards left{cardsLeft <= 2 ? "!" : "..."}
                </div>
            </LVCard>
        );
    }
    else
    {
        return null;
    }
}

const GamePage: React.FC = () => {

    const [playerDetails, setPlayerDetails] = useState<PlayerDetails[]>(clientApp.getUiProperty("playerDetails"));
    const [discardedCardTotals, setDiscardedCardTotals] = useState<number[]>(clientApp.getUiProperty("discardedCardTotals"));
    const [gameState, setGameState] = useState<GameState>(clientApp.getUiProperty("gameState"));
    const [playerId, setPlayerId] = useState<number>(clientApp.getUiProperty("playerId"));
    
    useEffect(() => {
        var listeners = new LVListenerList();
        listeners.onPropertyChange("playerDetails", function(value : PlayerDetails[]) { setPlayerDetails(value); });
        listeners.onPropertyChange("discardedCardTotals", function(value : number[]) { setDiscardedCardTotals(value); });
        listeners.onPropertyChange("gameState", function(value : GameState) { setGameState(value); });
        listeners.onPropertyChange("playerId", function(value : number) { setPlayerId(value); });
        return clientApp.effectListeners(listeners);
    });

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
            <PlayersList playerDetails={playerDetails} />
            <StartGameCard gameState={gameState} playerId={playerId} />
        </IonContent>
    </IonPage>
    );
};

export default GamePage;
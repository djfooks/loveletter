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
import Prando from 'prando';
import { CardType, totalNumberOfCards } from '../cards';
import { CardName, DotDotDot, LVCard, InteractionCard, PlayerCharacter, PlayerDetails, PlayerState, GameState } from '../Shared';
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

export function Tokens(props : {wins: number, seed: number})
{
    let rng = new Prando(props.seed);

    interface Gem
    {
        rotate: number;
        hueRotate: number;
        gemId: number;
    }

    var tokens : Gem[] = [];
    var i : number;
    for (i = 0; i < props.wins; i += 1)
    {
        tokens.push({ 
            gemId: rng.nextInt(0, 2),
            hueRotate: rng.nextInt(0, 359),
            rotate: rng.nextInt(0, 359)
        });
    }

    return (
        <>
            {
                tokens.map((gem, index) =>
                    <img key={index} className="gemImg" style={
                        {
                            "transform": "rotate(" + gem.rotate + "deg)",
                            "filter": "hue-rotate(" + gem.hueRotate + "deg)"
                        } }
                    src={"img/gem" + gem.gemId + ".svg"}
                    alt="T"/>
                )
            }
        </>
    );
}

interface PlayerLineProps {
    playerDetails: PlayerDetails;
    hasDropdown: boolean;
    seed: number;
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
                        <span className="middlerHack"></span>
                        <Tokens wins={this.props.playerDetails.wins} seed={this.props.seed} />
                        <span className="gemPadding"></span>
                        {
                            this.props.playerDetails.discarded.length > 0 ?
                                <IonIcon icon={this.state.dropdownOpen ? chevronUpOutline : chevronDownOutline} className="verticalAlignMiddle"></IonIcon>
                                : <span className="dropdownHiddenPadding"></span>
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

function PlayersList(props : {playerDetails : PlayerDetails[], turnId : number, roomSeed : number})
{
    return (<>{props.playerDetails.map((playerDetails, index) =>
        <LVCard key={playerDetails.name} highlight={props.turnId === index}>
            <PlayerLine playerDetails={playerDetails} hasDropdown={playerDetails.discarded.length > 0} seed={props.roomSeed + 10 * index}/>
        </LVCard>
    )}</>);
}

function StartGameCard(props : {playerDetails : PlayerDetails[], gameState: GameState, playerId: number})
{
    function handleStart()
    {
        clientApp.start();
    }

    if (props.gameState !== "LOGIN")
        return null;

    if (props.playerId === 0)
    {
        var i;
        var allPicked = true;
        for (i = 0; i < props.playerDetails.length; i += 1)
        {
            if (props.playerDetails[i].characterId === -1)
            {
                allPicked = false;
                break;
            }
        }
        if (allPicked)
        {
            if (props.playerDetails.length > 1)
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
                            Waiting for more players
                        </div>
                        <div className="interactionDots">
                            <DotDotDot />
                        </div>
                    </InteractionCard>
                );
            }
        }
        else
        {
            return (
                <InteractionCard>
                    <div className="interactionText">
                        Waiting players to pick character
                    </div>
                    <div className="interactionDots">
                        <DotDotDot />
                    </div>
                </InteractionCard>
            );
        }
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

function TopLine(props : {discardedCardTotals : number[], playerDetails: PlayerDetails[], gameState: GameState, roomCode: string})
{
    if (props.gameState === "LOGIN")
    {
        return (
            <InteractionCard>Room code {props.roomCode}</InteractionCard>
        );
    }

    var i;
    var totalDiscards = 0;
    for (i = 0; i < props.discardedCardTotals.length; i += 1)
    {
        totalDiscards += props.discardedCardTotals[i];
    }
    // -1 for hidden card, -1 for active player having 2 cards
    var cardsLeft = totalNumberOfCards - 2 - totalDiscards;
    for (i = 0; i < props.playerDetails.length; i += 1)
    {
        if (props.playerDetails[i].state !== "DEAD")
        {
            cardsLeft -= 1;
        }
    }

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
    const [roomSeed, setRoomSeed] = useState<number>(clientApp.getUiProperty("roomSeed"));
    const [room, setRoom] = useState<string>(clientApp.getUiProperty("roomcode"));
    const [playerId, setPlayerId] = useState<number>(clientApp.getUiProperty("playerId"));
    const [turnId, setTurnId] = useState<number>(clientApp.getUiProperty("turnId"));
    
    useEffect(() => {
        var listeners = new LVListenerList("game");
        listeners.onPropertyChange("roomcode", (value : string) => { setRoom(value); });
        listeners.onPropertyChange("playerDetails", function(value : PlayerDetails[]) { setPlayerDetails(value); });
        listeners.onPropertyChange("discardedCardTotals", function(value : number[]) { setDiscardedCardTotals(value); });
        listeners.onPropertyChange("gameState", function(value : GameState) { setGameState(value); });
        listeners.onPropertyChange("roomSeed", function(value : number) { setRoomSeed(value); });
        listeners.onPropertyChange("playerId", function(value : number) { setPlayerId(value); });
        listeners.onPropertyChange("turnId", function(value : number) { setTurnId(value); });
        return clientApp.effectListeners(listeners);
    }, []);

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
            <TopLine discardedCardTotals={discardedCardTotals} playerDetails={playerDetails} gameState={gameState} roomCode={room} />
            <PlayersList playerDetails={playerDetails} turnId={turnId} roomSeed={roomSeed} />
            <StartGameCard playerDetails={playerDetails} gameState={gameState} playerId={playerId} />
        </IonContent>
    </IonPage>
    );
};

export default GamePage;
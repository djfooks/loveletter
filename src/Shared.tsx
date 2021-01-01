import React from 'react';
import { getCardDetails, CardType } from './cards';
import { charactersMap } from './charactermap';

export type GameState = "LOGIN" | "PLAYING";
export type PlayerStatus = "ALIVE" | "DEAD" | "SAFE";
export type PlayedCardTotals = number[];

export interface Token
{
    gem: number
}

export interface PlayerDetails {
    name: string;
    characterId: number;
    state: PlayerStatus;
    tokens: Token[];
    discarded: CardType[];
}

export interface Interaction {
    playedCard : CardType;
    status : "REVEAL" | "CONTINUE" | "ROUND_COMPLETE" | null;
    targetId? : number;
    guess? : CardType;
    result? : "CORRECT_GUESS" | "TIE";
    loserId? : number;
    revealedCard? : CardType;
    otherCard? : CardType;
    discard? : CardType;
    swappedFor? : CardType;
    swappedForCardId? : number;
    prevCard? : CardType;
    
    // round end state
    hiddenCard? : CardType;
    finalCards? : CardType[];
    winnerIds? : number[];
}

export function LVCard(props : {children: any, highlight? : boolean})
{
    return (
        <div className={props.highlight ? "myCard myCardHighlight" : "myCard"}>
            {props.children}
        </div>
    );
}

export function InteractionCard(props : {children: any})
{
    return (
        <div className="myCard">
            <div className="interactionText">
                {props.children}
            </div>
        </div>
    );
}

export function CardName(props : {card: CardType})
{
    return <span className={"cardName cardName" + props.card}>{getCardDetails(props.card).name} ({getCardDetails(props.card).value})</span>;
}

export function CardImgAndDetails(props : {card: CardType})
{
    return (
        <React.Fragment>
            <img className="cardImg" src={"img/" + props.card + ".png"} alt={props.card}></img>
            <div className="cardText">{getCardDetails(props.card).action}</div>
        </React.Fragment>
    );
}

export function PlayerCharacterName(props : {playerDetails: PlayerDetails})
{
    return (
        <React.Fragment>
            <PlayerCharacter playerDetails={props.playerDetails}/>
            <span className="playerName">{props.playerDetails.name}</span>
        </React.Fragment>
    );
}

export function PlayerCharacter(props : {playerDetails: PlayerDetails})
{
    var imgPath;
    if (props.playerDetails.characterId === null)
    {
        imgPath = "img/unknown-character.svg";
    }
    else if (props.playerDetails.state === "ALIVE" || props.playerDetails.state === "SAFE")
    {
        imgPath = "img/characters/" + charactersMap[props.playerDetails.characterId];
    }
    else // DEAD
    {
        imgPath = "img/dead-characters/" + charactersMap[props.playerDetails.characterId];
    }
    return <img className="characterImg" src={imgPath} alt={imgPath}/>;
}

export function PlayerState(props : { status : PlayerStatus })
{
    if (props.status === "SAFE")
    {
        return <img className="statusImg" src="img/shield.svg" alt="SAFE"/>;
    }
    else if (props.status === "DEAD")
    {
        return <img className="statusImg" src="img/danger.svg" alt="DEAD"/>;
    }
    return null;
}

interface DotDotDotState {
    "counter": number;
}
export class DotDotDot extends React.Component<{}, DotDotDotState> {
    timerID : NodeJS.Timeout | null;

    constructor(props : any)
    {
        super(props);
        this.state = {"counter": 3};
        this.timerID = null;
    }

    componentDidMount()
    {
        this.timerID = setInterval(
            () => this.tick(),
            500
        );
    }

    componentWillUnmount()
    {
        if (this.timerID)
            clearInterval(this.timerID);
    }

    tick()
    {
        this.setState((state, props) => (
            {"counter": (state.counter + 1) % 4}
        ));
    }

    render()
    {
        var resultStr = "";
        var i;
        for (i = -1; i < this.state.counter; i += 1)
        {
            resultStr += ".";
        }

        return (
            <span>{resultStr}</span>
        );
    }
}

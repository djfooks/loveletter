import React from 'react';
import { cardDetailsMap } from './cards';
import { charactersMap } from './charactermap';

export type PlayerState = "ALIVE" | "DEAD" | "SAFE";
export type PlayedCardTotals = number[];

export interface Token
{
    gem: number
}

export interface PlayerDetails {
    name: string;
    characterId: number;
    state: PlayerState;
    tokens: Token[];
    discarded: string[];
}

export function LVCard(props : {children: any})
{
    return (
        <div className="myCard">
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

export function CardName(props : {card: string})
{
    return <span className={"cardName cardName" + props.card}>{cardDetailsMap[props.card].name} ({cardDetailsMap[props.card].value})</span>;
}

export function CardImgAndDetails(props : {card: string})
{
    return (
        <React.Fragment>
            <img className="cardImg" src={"img/" + props.card + ".png"} alt={props.card}></img>
            <div className="cardText">{cardDetailsMap[props.card].action}</div>
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

export function PlayerState(props : { state : PlayerState })
{
    if (props.state === "SAFE")
    {
        return <img className="statusImg" src="img/shield.svg" alt="SAFE"/>;
    }
    else if (props.state === "DEAD")
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

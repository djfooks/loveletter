import {
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router';
import './Page.css';
import { caretForwardCircleOutline, accessibilityOutline, tabletPortraitOutline } from 'ionicons/icons';
import GamePage from './GamePage';
import CardPage from './CardPage';
import { CardName, PlayerDetails, PlayerState } from '../Shared';
import { CardType } from '../cards';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';
import InteractionPage from './InteractionPage';

const GameTabPage: React.FC = () => {

    const [hand, setHand] = useState<CardType[]>(clientApp.getUiProperty("hand"));
    const [playerDetails, setPlayerDetails] = useState<PlayerDetails[]>(clientApp.getUiProperty("playerDetails"));
    const [playerId, setPlayerId] = useState<number>(clientApp.getUiProperty("playerId"));
    
    useEffect(() => {
        var listeners = new LVListenerList("game");
        listeners.onPropertyChange("hand", function(value) { setHand(value); });
        listeners.onPropertyChange("playerDetails", function(value : PlayerDetails[]) { setPlayerDetails(value); });
        listeners.onPropertyChange("playerId", function(value : number) { setPlayerId(value); });
        return clientApp.effectListeners(listeners);
    }, []);

    var cardIcon = <IonIcon icon={tabletPortraitOutline} />;
    var isDead = false;
    if (playerDetails && playerId !== undefined && playerId >= 0 && playerId < playerDetails.length)
    {
        if (playerDetails[playerId].state === "DEAD")
        {
            cardIcon = <PlayerState status="DEAD"></PlayerState>;
            isDead = true;
        }
    }

    return (
    <IonTabs>
        <IonRouterOutlet>
            <Redirect exact path="/tabs" to="/tabs/game" />
            <Redirect exact path="/" to="/tabs/game" />
            <Route path="/tabs/game" render={() => <GamePage />} exact />
            <Route path="/tabs/card/0" render={() => <CardPage handId={0} />} exact />
            <Route path="/tabs/card/1" render={() => <CardPage handId={1} />} exact />
            <Route path="/tabs/interaction" render={() => <InteractionPage />} exact />
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
            <IonTabButton tab="interaction" href="/tabs/interaction">
                <IonIcon icon={caretForwardCircleOutline} />
                <IonLabel>Action</IonLabel>
            </IonTabButton>
            <IonTabButton tab="game" href="/tabs/game">
                <IonIcon icon={accessibilityOutline} />
                <IonLabel>Players</IonLabel>
            </IonTabButton>
            {
                <IonTabButton tab="card0" href="/tabs/card/0" disabled={isDead}>
                    {cardIcon}
                    {
                        isDead ? "DEAD" : (
                            hand.length === 0 ? "None" :
                            <CardName card={hand[0]}></CardName>)
                    }
                </IonTabButton>
            }
            {
                hand.length <= 1 ? "None" :
                <IonTabButton tab="card1" href="/tabs/card/1">
                    <IonIcon icon={tabletPortraitOutline} />
                    <CardName card={hand[1]}></CardName>
                </IonTabButton>
            }
        </IonTabBar>
    </IonTabs>
    );
};

export default GameTabPage;

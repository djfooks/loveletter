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
import { CardName } from '../Shared';
import { CardType } from '../cards';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';
import InteractionPage from './InteractionPage';

const GameTabPage: React.FC = () => {

    const [hand, setHand] = useState<CardType[]>(clientApp.getUiProperty("hand"));
    const [hasInteraction, setHasInteraction] = useState<boolean>(clientApp.getUiProperty("hasInteraction"));
    
    useEffect(() => {
        var listeners = new LVListenerList();
        listeners.onPropertyChange("hand", function(value) { setHand(value); });
        listeners.onPropertyChange("hasInteraction", function(value : boolean) { setHasInteraction(value); });
        return clientApp.effectListeners(listeners);
    });

    return (
    <IonTabs>
        <IonRouterOutlet>
            <Redirect exact path="/tabs" to="/tabs/game" />
            <Route path="/tabs/game" render={() => <GamePage />} exact />
            <Route path="/tabs/card/0" render={() => <CardPage handId={0} />} exact />
            <Route path="/tabs/card/1" render={() => <CardPage handId={1} />} exact />
            <Route path="/tabs/interaction" render={() => <InteractionPage />} exact />
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
            {
                !hasInteraction ? null :
                <IonTabButton tab="interaction" href="/tabs/interaction">
                    <IonIcon icon={caretForwardCircleOutline} />
                    <IonLabel>Action</IonLabel>
                </IonTabButton>
            }
            <IonTabButton tab="game" href="/tabs/game">
                <IonIcon icon={accessibilityOutline} />
                <IonLabel>Players</IonLabel>
            </IonTabButton>
            {
                hand.length === 0 ? null :
                <IonTabButton tab="card0" href="/tabs/card/0">
                    <IonIcon icon={tabletPortraitOutline} />
                    <CardName card={hand[0]}></CardName>
                </IonTabButton>
            }
            {
                hand.length <= 1 ? null :
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

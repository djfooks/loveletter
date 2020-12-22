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
import { caretForwardCircleOutline } from 'ionicons/icons';
import GamePage from './GamePage';
import CardPage from './CardPage';
import { CardName } from '../Shared';
import { CardType } from '../cards';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';

const GameTabPage: React.FC = () => {

    const [hand, setHand] = useState<CardType[]>(clientApp.getUiProperty("hand"));
    
    useEffect(() => {
        var listeners = new LVListenerList();
        listeners.onPropertyChange("hand", function(value) { setHand(value); });
        return clientApp.effectListeners(listeners);
    });

    return (
    <IonTabs>
        <IonRouterOutlet>
            <Redirect exact path="/tabs" to="/tabs/card" />
            <Route path="/tabs/game" render={() => <GamePage />} exact />
            <Route path="/tabs/card" component={CardPage} />
            <Route path="/tabs/card/:handId" component={CardPage} />
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
            <IonTabButton tab="game" href="/tabs/game">
                <IonIcon icon={caretForwardCircleOutline} />
                <IonLabel>Table</IonLabel>
            </IonTabButton>
            {
                hand.length === 0 ? null :
                <IonTabButton tab="card0" href="/tabs/card/0">
                    <CardName card={hand[0]}></CardName>
                </IonTabButton>
            }
            {
                hand.length <= 1 ? null :
                <IonTabButton tab="card1" href="/tabs/card/1">
                    <CardName card={hand[1]}></CardName>
                </IonTabButton>
            }
        </IonTabBar>
    </IonTabs>
    );
};

export default GameTabPage;

import {
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs} from '@ionic/react';
import React from 'react';
import { Redirect, Route } from 'react-router';
import './Page.css';
import { caretForwardCircleOutline } from 'ionicons/icons';
import GamePage from './GamePage';
import CardPage from './CardPage';
import { CardName } from '../Shared';

const GameTabPage: React.FC = () => {
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
            <IonTabButton tab="card0" href="/tabs/card/0">
                <CardName card="PRINCE"></CardName>
            </IonTabButton>
            <IonTabButton tab="card1" href="/tabs/card/1">
                <CardName card="GUARD"></CardName>
            </IonTabButton>
        </IonTabBar>
    </IonTabs>
    );
};

export default GameTabPage;

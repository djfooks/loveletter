import {
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
} from '@ionic/react';

import React, { useEffect, useState } from 'react';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import { caretForwardCircleOutline, codeOutline, helpCircleOutline } from 'ionicons/icons';
import './Menu.css';
import { LVListenerList } from '../UIListeners';
import { clientApp } from '../ClientApp';
import { PlayerCharacter, PlayerDetails } from '../Shared';

interface AppPage {
    url: string;
    icon: string;
    title: string;
}

const loginPage = '/page/Login';

const appPages: AppPage[] = [
    {
        title: 'Game',
        url: '/tabs/game',
        icon: caretForwardCircleOutline
    },
    {
        title: 'Help',
        url: '/page/Help',
        icon: helpCircleOutline
    }
];

const Menu: React.FC = () => {
    const location = useLocation();

    let history = useHistory();
    
    const [loggedIn, setLoggedIn] = useState<boolean>(clientApp.getUiProperty("loggedIn"));
    const [room, setRoom] = useState<string>(clientApp.getUiProperty("roomcode"));
    const [playerDetails, setPlayerDetails] = useState<PlayerDetails[]>(clientApp.getUiProperty("playerDetails"));
    const [playerId, setPlayerId] = useState<number>(clientApp.getUiProperty("playerId"));

    useEffect(() => {
        var listeners = new LVListenerList("menu");
        listeners.onPropertyChange("roomcode", (value : string) => { setRoom(value); });
        listeners.onPropertyChange("loggedIn", function (v : boolean) { setLoggedIn(v); });
        listeners.onPropertyChange("playerDetails", function (v : PlayerDetails[]) { setPlayerDetails(v); });
        listeners.onPropertyChange("playerId", function (v : number) { setPlayerId(v); });
        listeners.onEvent("redirect", function(v : string) { history.push(v); });
        return clientApp.effectListeners(listeners);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!loggedIn)
    {
        return (
            <Redirect to={loginPage}></Redirect>
        );
    }

    if (location.pathname === loginPage)
    {
        return null;
    }

    return (
        <IonMenu contentId="main" type="overlay">
            <IonContent>
                <IonList>
                    {
                        playerDetails[playerId] === undefined || playerDetails[playerId].characterId === null ? null :
                        <IonItem lines="none" detail={false}>
                            <div className="menuCharacter">
                                <PlayerCharacter playerDetails={playerDetails[playerId]}></PlayerCharacter>
                            </div>
                        </IonItem>
                    }
                    <IonItem lines="none" detail={false}>
                        <IonIcon slot="start" icon={codeOutline} />
                        <IonLabel>Room: {room}</IonLabel>
                    </IonItem>
                    { location.pathname === "/page/PickCharacter" ? null : appPages.map((appPage, index) => {
                        return (
                            <IonItem key={index} className={location.pathname.startsWith(appPage.url) ? 'selected' : ''} routerLink={appPage.url} routerDirection="none" lines="none" detail={false}>
                                <IonIcon slot="start" icon={appPage.icon} />
                                <IonLabel>{appPage.title}</IonLabel>
                            </IonItem>
                        );
                    })}
                </IonList>
            </IonContent>
        </IonMenu>
    );
};

export default Menu;

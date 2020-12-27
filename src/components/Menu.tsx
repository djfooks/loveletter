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
import { caretForwardCircleOutline, codeOutline, exitOutline, helpCircleOutline } from 'ionicons/icons';
import './Menu.css';
import { LVListenerList } from '../UIListeners';
import { clientApp } from '../ClientApp';

interface AppPage {
    url: string;
    icon: string;
    title: string;
}

const loginPage = '/page/Login';

const appPages: AppPage[] = [
    {
        title: 'Game',
        url: '/tabs',
        icon: caretForwardCircleOutline
    },
    {
        title: 'Help',
        url: '/page/Help',
        icon: helpCircleOutline
    },
    {
        title: 'Leave Room',
        url: loginPage,
        icon: exitOutline
    }
];

const Menu: React.FC = () => {
    const location = useLocation();

    let history = useHistory();
    
    const [loggedIn, setLoggedIn] = useState<boolean>(clientApp.getUiProperty("loggedIn"));
    const [room, setRoom] = useState<string>(clientApp.getUiProperty("roomcode"));

    useEffect(() => {
        var listeners = new LVListenerList();
        listeners.onPropertyChange("roomcode", (value : string) => { setRoom(value); });
        listeners.onPropertyChange("loggedIn", function (v : boolean) { setLoggedIn(v); });
        listeners.onEvent("redirect", function(v : string) { history.push(v); });
        return clientApp.effectListeners(listeners);
    });

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
                    <IonItem lines="none" detail={false}>
                        <IonIcon slot="start" icon={codeOutline} />
                        <IonLabel>Room: {room}</IonLabel>
                    </IonItem>
                    {appPages.map((appPage, index) => {
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

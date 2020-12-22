import {
    IonButtons,
    IonContent, 
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { Redirect, RouteComponentProps } from 'react-router';
import { CardType } from '../cards';
import { CardImgAndDetails, CardName, LVCard } from '../Shared';
import './Page.css';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';

interface CardPageProps extends RouteComponentProps<{
    handId?: string;
  }> {}

const CardPage: React.FC<CardPageProps> = ({ match }) => {

    const [hand, setHand] = useState<CardType[]>(clientApp.getUiProperty("hand"));

    useEffect(() => {
        var listeners = new LVListenerList();
        listeners.onPropertyChange("hand", function(value) { setHand(value); });
        return clientApp.effectListeners(listeners);
    });

    if (match.params.handId === undefined)
    {
        return (<Redirect to="/tabs/game"></Redirect>);
    }

    var handId : number = parseInt(match.params.handId!);

    return (
    <IonPage>
        <IonContent fullscreen>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle><CardName card={hand[handId]}></CardName></IonTitle>
                </IonToolbar>
            </IonHeader>
            <LVCard>
                <CardImgAndDetails card={hand[handId]}/>
            </LVCard>
        </IonContent>
    </IonPage>
    );
};

export default CardPage;
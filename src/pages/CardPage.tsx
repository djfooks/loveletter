import {
    IonButtons,
    IonContent, 
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar} from '@ionic/react';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { CardImgAndDetails, LVCard } from '../Shared';
import './Page.css';

interface CardPageProps extends RouteComponentProps<{
    handId?: string;
  }> {}

const CardPage: React.FC<CardPageProps> = ({ match }) => {
    var card = "GUARD";

    return (
    <IonPage>
        <IonContent fullscreen>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>Card Page {match.params.handId}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <LVCard>
                <CardImgAndDetails card={card}/>
            </LVCard>
        </IonContent>
    </IonPage>
    );
};

export default CardPage;
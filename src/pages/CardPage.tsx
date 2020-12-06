import {
    IonButtons, 
    IonCard, 
    IonContent, 
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar} from '@ionic/react';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import './Page.css';

interface CardPageProps extends RouteComponentProps<{
    handId: string;
  }> {}

const CardPage: React.FC<CardPageProps> = ({ match }) => {
    return (
    <IonPage id="card">
        <IonContent fullscreen>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>Card</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonCard>
                Card Page {match.params.handId}!
            </IonCard>
        </IonContent>
    </IonPage>
    );
};

export default CardPage;
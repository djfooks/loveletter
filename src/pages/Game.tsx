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
import './Page.css';

const GamePage: React.FC = () => {
    return (
    <IonPage>
        <IonHeader>
            <IonToolbar>
                <IonButtons slot="start">
                    <IonMenuButton />
                </IonButtons>
                <IonTitle>Game</IonTitle>
            </IonToolbar>
        </IonHeader>

        <IonContent fullscreen>
            <IonCard>
                Hello world!
            </IonCard>
        </IonContent>
    </IonPage>
    );
};

export default GamePage;

import {
    IonButtons, 
    IonContent, 
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSlides,
    IonSlide} from '@ionic/react';
import React from 'react';
import './Page.css';

const PickCharacterPage: React.FC = () => {
    return (
    <IonPage>
        <IonHeader>
            <IonToolbar>
                <IonButtons slot="start">
                    <IonMenuButton />
                </IonButtons>
                <IonTitle>Pick Character</IonTitle>
            </IonToolbar>
        </IonHeader>

        <IonContent fullscreen>
        </IonContent>
    </IonPage>
    );
};

export default HelpPage;

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
import { cardDetailsMap, orderedCards } from '../cards';
import './Page.css';
import { CardImgAndDetails, CardName, PlayedCardTotals, LVCard } from '../Shared'

function QuickHelpList(props : {playedCardTotals: PlayedCardTotals})
{
    return <>{
        orderedCards.map((cardType, index) =>
        <div key={cardType}>
            <span className="alignLeft"><CardName card={cardType} /></span>
            <span className="alignRight">{props.playedCardTotals[index]} / {cardDetailsMap[cardType].numInDeck}</span>
            <br />
            <br />
        </div>
    )}</>;
}

function QuickHelpCard(props : {playedCardTotals: PlayedCardTotals})
{
    return (
        <LVCard>
            <span className="alignLeft">Card (value)</span>
            <span className="alignRight"># Played / # In Deck</span><br/><br/>
            <QuickHelpList playedCardTotals={props.playedCardTotals} />
        </LVCard>
    );
}

function HelpCardItems()
{
    return (<>{orderedCards.map((cardType, index) =>
        <IonSlide key={cardType}>
            <LVCard>
                <CardImgAndDetails card={cardType} />
            </LVCard>
        </IonSlide>
    )}</>)
}

const HelpPage: React.FC = () => {
    return (
    <IonPage>
        <IonHeader>
            <IonToolbar>
                <IonButtons slot="start">
                    <IonMenuButton />
                </IonButtons>
                <IonTitle>Help</IonTitle>
            </IonToolbar>
        </IonHeader>

        <IonContent fullscreen>
        <IonSlides>
            <IonSlide>
                <QuickHelpCard playedCardTotals={[1,2,3,4,5,6,7,8]} />
            </IonSlide>
            <HelpCardItems />
        </IonSlides>
        </IonContent>
    </IonPage>
    );
};

export default HelpPage;

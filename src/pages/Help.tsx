import {
    IonButtons, 
    IonCard, 
    IonContent, 
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    IonItem,
    IonSlides,
    IonSlide} from '@ionic/react';
import React from 'react';
import { cardDetailsMap, orderedCards } from '../cards';
import './Page.css';
import { CardImgAndDetails, CardName, PlayedCardTotals } from '../Shared'

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
        <IonCard>
            <span className="alignLeft">Card (value)</span>
            <span className="alignRight"># Played / # In Deck</span><br/><br/>
            <QuickHelpList playedCardTotals={props.playedCardTotals} />
        </IonCard>
    );
}

function HelpCardItems()
{
    return (<>{orderedCards.map((cardType, index) =>
        <IonSlide key={cardType}>
            <IonCard>
                <CardImgAndDetails card={cardType} />
            </IonCard>
        </IonSlide>
    )}</>)
}

const GamePage: React.FC = () => {
    var items = [];
    var i;
    for (i = 0; i < 300; i += 1)
    {
        items[i] = 
        <IonItem key={i}>
            <IonCard>
                Hello!
            </IonCard>
        </IonItem>;
    }

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

export default GamePage;

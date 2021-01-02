import {
    IonButtons, 
    IonContent, 
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSlides,
    IonSlide,
    IonButton} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react';
import { getCardDetails, orderedCards } from '../cards';
import './Page.css';
import { CardImgAndDetails, CardName, DiscardedCardTotals, LVCard } from '../Shared'
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';

type GotoSlideCb = (index : number) => void;

function QuickHelpList(props : {discardedCardTotals: DiscardedCardTotals, gotoSlideCb : GotoSlideCb})
{
    function handleClick(index : number)
    {
        props.gotoSlideCb(index + 1);
    }

    return <>{
        orderedCards.map((cardType, index) =>
        <div key={cardType} onClick={() => handleClick(index)}>
            <span className="alignLeft"><CardName card={cardType} /></span>
            <span className="alignRight">{props.discardedCardTotals[index]} / {getCardDetails(cardType).numInDeck}</span>
            <br />
            <br />
        </div>
    )}</>;
}

function QuickHelpCard(props : {discardedCardTotals: DiscardedCardTotals, gotoSlideCb : GotoSlideCb})
{
    return (
        <LVCard>
            <span className="alignLeft">Card (value)</span>
            <span className="alignRight"># Discarded / # In Deck</span><br/><br/>
            <QuickHelpList discardedCardTotals={props.discardedCardTotals} gotoSlideCb={props.gotoSlideCb} />
        </LVCard>
    );
}

function HelpCardItems(props : {gotoSlideCb : GotoSlideCb})
{
    function handleClick()
    {
        props.gotoSlideCb(0);
    }

    return (<>{orderedCards.map((cardType, index) =>
        <IonSlide key={cardType}>
            <LVCard>
                <CardImgAndDetails card={cardType} />
                <IonButton onClick={handleClick}>Back</IonButton>
            </LVCard>
        </IonSlide>
    )}</>)
}

const HelpPage: React.FC = () => {
    
    const [discardedCardTotals, setDiscardedCardTotals] = useState<number[]>(clientApp.getUiProperty("discardedCardTotals"));
    
    useEffect(() => {
        var listeners = new LVListenerList("help");
        listeners.onPropertyChange("discardedCardTotals", function(value : number[]) { setDiscardedCardTotals(value); });
        return clientApp.effectListeners(listeners);
    }, []);

    const slidesRef = useRef<HTMLIonSlidesElement>(null);

    const handleGotoSlideCb = function (index : number)
    {
        slidesRef.current?.slideTo(index);
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
        <IonSlides ref={slidesRef}>
            <IonSlide>
                <QuickHelpCard discardedCardTotals={discardedCardTotals} gotoSlideCb={handleGotoSlideCb} />
            </IonSlide>
            <HelpCardItems gotoSlideCb={handleGotoSlideCb}/>
        </IonSlides>
        </IonContent>
    </IonPage>
    );
};

export default HelpPage;

import {
    IonButton,
    IonButtons, 
    IonContent, 
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { charactersMap } from '../charactermap';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';
import './Page.css';

function PickCharacterElement(props : {id: number, img : string, isAlreadyPicked: boolean, isSelected: boolean, isPicked: boolean, pickedCharacterCb: (value : number) => void})
{
    function handleClick()
    {
        props.pickedCharacterCb(props.id);
    }

    return (
        <div className={props.isAlreadyPicked ? "characterGridCellAlreadyPicked" :
                        props.isSelected ? "characterGridCellSelected" :
                        props.isPicked ? "characterGridCellPicked" : "characterGridCell"} onClick={handleClick}>
            <img src={"img/characters/" + props.img} className="characterImg" onClick={handleClick} alt="lol"/>
        </div>
    );
}

function PickCharacterElements(props : {selectedCharacterId: number, alreadyPickedIds: number[], pickedCharacterId: number, pickedCharacterCb: (value : number) => void})
{
    return <>{
        charactersMap.map((characterImg, index) =>
            <PickCharacterElement
                key={index}
                id={index}
                img={characterImg}
                isSelected={props.selectedCharacterId === index}
                isAlreadyPicked={props.alreadyPickedIds.indexOf(index) !== -1}
                isPicked={props.pickedCharacterId === index}
                pickedCharacterCb={props.pickedCharacterCb}
                />
        )
    }</>
}

const PickCharacterPage: React.FC = () => {
    const [selectedCharacterId, setSelectedCharacterId] = useState<number>(clientApp.getUiProperty("pickedCharacterId"));
    const [alreadyPickedIds, setAlreadyPickedIds] = useState<number[]>(clientApp.getUiProperty("alreadyPickedIds"));
    const [pickedCharacterId, setPickedCharacterId] = useState<number>(clientApp.getUiProperty("pickedCharacterId"));
    const [pickDisabled, setPickDisabled] = useState<boolean>(false);

    useEffect(() => {
        var listeners = new LVListenerList("pickCharacter");
        listeners.onPropertyChange("pickedCharacterId", function(value) { setPickedCharacterId(value); setSelectedCharacterId(value); });
        listeners.onPropertyChange("alreadyPickedIds", (v : number[]) => setAlreadyPickedIds(v));
        listeners.onEvent("pickedCharacterInUse", function () { setPickDisabled(false); });
        return clientApp.effectListeners(listeners);
    }, []);

    function handlePickClick()
    {
        setPickDisabled(true);
        clientApp.pickCharacter(selectedCharacterId);
    }

    function handleCharacterClick(characterId : number)
    {
        setSelectedCharacterId(characterId);
    }

    return (
    <IonPage>
        <IonHeader>
            <IonToolbar>
                <IonButtons slot="start">
                    <IonMenuButton />
                </IonButtons>
                <IonTitle>
                    <IonButton
                        disabled={selectedCharacterId === -1 || (pickedCharacterId !== selectedCharacterId && alreadyPickedIds.indexOf(selectedCharacterId) !== -1) || pickDisabled}
                        onClick={handlePickClick}
                        >
                        Pick Character
                    </IonButton>
                </IonTitle>
            </IonToolbar>
        </IonHeader>

        <IonContent fullscreen>
            <div>
                <div className="grid">
                    <PickCharacterElements selectedCharacterId={selectedCharacterId} alreadyPickedIds={alreadyPickedIds} pickedCharacterId={pickedCharacterId} pickedCharacterCb={handleCharacterClick}/>
                </div>
                <div>Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
            </div>
        </IonContent>
    </IonPage>
    );
};

export default PickCharacterPage;

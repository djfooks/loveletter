import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonItem, IonList, IonButton, IonToast } from '@ionic/react';
import { clientApp } from '../ClientApp';
import { LVListenerList } from '../UIListeners';
import { Redirect } from 'react-router';


export const LoginPage: React.FC = () => {

    const [name, setName] = useState<string>(clientApp.getUiProperty("username"));
    const [room, setRoom] = useState<string>(clientApp.getUiProperty("roomcode"));
    const [joiningRoom, setJoiningRoom] = useState<string>("");
    const [createRoomEnable, setCreateRoomEnable] = useState<boolean>(true);
    const [joinRoomEnable, setJoinRoomEnable] = useState<boolean>(true);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [joinedRoom, setJoinedRoom] = useState<boolean>(false);
    const [gotoLobby, setGotoLobby] = useState<boolean>(false);

    useEffect(() => {
        var listeners = new LVListenerList();
        listeners.onPropertyChange("roomcode", (value : string) => { setRoom(value); });
        listeners.onEvent("connectionError", function()
        {
            setShowToast(true);
            setJoinRoomEnable(true);
            setCreateRoomEnable(true);
            setJoinedRoom(false);
        });
        listeners.onEvent("leaveRoom", function()
        {
            setJoinRoomEnable(true);
            setCreateRoomEnable(true);
            setJoinedRoom(false);
        });
        listeners.onEvent("joinRoom", (shouldGotoLobby : boolean) => { setJoinedRoom(true); setGotoLobby(shouldGotoLobby) });
        return clientApp.effectListeners(listeners);
    });

    if (joinedRoom)
    {
        return <Redirect to={gotoLobby ? "/tabs" : "/page/PickCharacter" } />
    }

    function joinRoom()
    {
        clientApp.joinRoom(name, room);
        setJoinRoomEnable(false);
        setJoiningRoom(room);
    }
    function createRoom()
    {
        setRoom("");
        clientApp.createRoom();
        setCreateRoomEnable(false);
    }
    
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Loveletter</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    <IonItem>
                        <IonInput value={name} placeholder="NAME" onIonChange={e => setName(e.detail.value!)} clearInput maxlength={15}></IonInput>
                    </IonItem>
                    <IonItem>
                        <IonInput value={room} placeholder="ROOM CODE" onIonChange={e => setRoom(e.detail.value!)} clearInput maxlength={4} autocapitalize="characters" className="uppercase-input"></IonInput>
                        <IonButton onClick={joinRoom} disabled={!joinRoomEnable || room.length < 4 || name.length < 3}>Join Room</IonButton>
                        <IonButton onClick={createRoom} disabled={!createRoomEnable}>Create Room</IonButton>
                    </IonItem>
                </IonList>
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={"Failed connecting to room code " + joiningRoom + "."}
                    duration={5000}
                />
            </IonContent>
            
        </IonPage>
    );
};
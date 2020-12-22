import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
} from '@ionic/react';

import React from 'react';
import { useLocation } from 'react-router-dom';
import { caretForwardCircleOutline, codeOutline, exitOutline, helpCircleOutline } from 'ionicons/icons';
import './Menu.css';

interface AppPage {
  url: string;
  icon: string;
  title: string;
}

const appPages: AppPage[] = [
  {
    title: 'Game',
    url: '/tabs',
    icon: caretForwardCircleOutline
  },
  {
    title: 'Help',
    url: '/page/Help',
    icon: helpCircleOutline
  },
  {
    title: 'Leave Room',
    url: '/page/Login',
    icon: exitOutline
  }
];

const Menu: React.FC = () => {
  const location = useLocation();

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <IonItem lines="none" detail={false}>
            <IonIcon slot="start" icon={codeOutline} />
            <IonLabel>Room: XYZD</IonLabel>
          </IonItem>
          {appPages.map((appPage, index) => {
            return (
              <IonMenuToggle key={index} autoHide={true}>
                <IonItem className={location.pathname.startsWith(appPage.url) ? 'selected' : ''} routerLink={appPage.url} routerDirection="none" lines="none" detail={false}>
                  <IonIcon slot="start" icon={appPage.icon} />
                  <IonLabel>{appPage.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;

import Menu from './components/Menu';
import GameTabPage from './pages/GameTab';
import HelpPage from './pages/HelpPage';
import { InputExamples } from './pages/Page';
import PickCharacterPage from './pages/PickCharacterPage';
import { LoginPage } from './pages/LoginPage';
import React from 'react';
import { IonApp, IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import RoundCompletePage from './pages/RoundComplete';

const App: React.FC = () => {

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          <Menu />
          <IonRouterOutlet id="main">
            <Route path="/tabs" render={() => <GameTabPage />} />
            <Route path="/page/Login" component={LoginPage} exact />
            <Route path="/page/PickCharacter" component={PickCharacterPage} exact />
            <Route path="/page/Help" component={HelpPage} exact />
            <Route path="/page/RoundComplete" component={RoundCompletePage} exact />
            <Route path="/page/Test" component={InputExamples} exact />
            <Redirect from="/" to="/page/Login" exact />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;

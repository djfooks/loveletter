
function InteractionCard(props)
{
    return (
        <ons-card>
            <div className="interactionText">
                {props.children}
            </div>
        </ons-card>
    );
}

function CardName(props)
{
    return <span className={"cardName cardName" + props.card}>{cardDetailsMap[props.card].name} ({cardDetailsMap[props.card].value})</span>;
}

function CardImgAndDetails(props)
{
    return (
        <React.Fragment>
            <img className="cardImg" src={"img/" + props.card + ".png"}/>
            <div className="cardText">{cardDetailsMap[props.card].action}</div>
        </React.Fragment>
    );
}

function PlayerCharacterName(props)
{
    return (
        <React.Fragment>
            <PlayerCharacter playerDetails={props.playerDetails}/>
            <span className="playerName">{props.playerDetails.name}</span>
        </React.Fragment>
    );
}

function PlayerCharacter(props)
{
    var imgPath;
    if (props.playerDetails.state == "ALIVE" || props.playerDetails.state == "SAFE")
    {
        imgPath = "img/characters/" + charactersMap[props.playerDetails.character];
    }
    else // DEAD
    {
        imgPath = "img/dead-characters/" + charactersMap[props.playerDetails.character];
    }
    return <img className="characterImg" src={imgPath}/>;
}

function PlayerState(props)
{
    if (props.state == "SAFE")
    {
        return <img className="statusImg" src="img/shield.svg"/>;
    }
    else if (props.state == "DEAD")
    {
        return <img className="statusImg" src="img/danger.svg"/>;
    }
    return null;
}

class DotDotDot extends React.Component {
  constructor(props) {
    super(props);
    this.state = {"counter": 3};
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      500
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState((state, props) => (
      {"counter": (state.counter + 1) % 4}
    ));
  }

  render() {
    var resultStr = "";
    var i;
    for (i = -1; i < this.state.counter; i += 1)
    {
        resultStr += ".";
    }

    return (
      <span>{resultStr}</span>
    );
  }
}

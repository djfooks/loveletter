
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
      {"counter": (state.counter + 1) % 3}
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

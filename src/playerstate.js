
function PlayerState(id)
{
    this.id = id;
    this.name = "";
    this.state = "ALIVE";
    this.roundsWon = 0;
    this.lastAction = "";
    this.lastCard = -1;
    this.lastTarget = -1;
    this.lastGuess = "";
}


function PickCharacterElement(props)
{
    function handleClick()
    {
        app.selectCharacter(props.id);
    }

    return (
        <div className={props.isAlreadyPicked ? "characterGridCellAlreadyPicked" :
                        props.isSelected ? "characterGridCellSelected" :
                        props.isPicked ? "characterGridCellPicked" : "characterGridCell"} onClick={handleClick}>
            <img src={"img/characters/" + props.img} className="characterImg" onClick={handleClick}/>
        </div>
    );
}

function PickCharacterElements(props)
{
    return charactersMap.map((characterImg, index) =>
            <PickCharacterElement
                key={index}
                id={index}
                img={characterImg}
                isSelected={props.selectedCharacterId == index}
                isAlreadyPicked={props.alreadyPickedIds.indexOf(index) != -1}
                isPicked={props.pickedCharacterId == index}
                />
        );
}

function PickCharacterPageContent(props)
{
    return (
        <div>
            <div className="grid">
                <PickCharacterElements selectedCharacterId={props.selectedCharacterId} alreadyPickedIds={props.alreadyPickedIds} pickedCharacterId={props.pickedCharacterId} />
            </div>
            <div>Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
        </div>
    );
}

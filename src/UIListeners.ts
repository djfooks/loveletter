
export type UIChangeCallback = (value : any) => void;

export type LVUIProperty =
    "playerDetails"
    | "hand"
    | "discardedCardTotals"
    | "playerId"
    | "turnId"
    | "interaction"
    | "gameState"
    | "loggedIn"
    | "username"
    | "roomcode"
    | "pickedCharacterId"
    | "alreadyPickedIds"
    | "roomSeed";

export type LVUIEvent =
    "leaveRoom"
    | "connectionError"
    | "joinRoom"
    | "pickedCharacterInUse"
    | "redirect";

type LVListenerType = "PROPERTY" | "EVENT";
export class LVListener
{
    name : string;
    id : number;
    callback : UIChangeCallback;
    listenerType : LVListenerType;
    tag : string;
    prevValueStr : string;

    constructor(listenerType: LVListenerType, tag : string, name : string, callback : UIChangeCallback)
    {
        this.listenerType = listenerType;
        this.tag = tag;
        this.name = name;
        this.callback = callback;
        this.id = -1;
        this.prevValueStr = "";
    }
}

interface UIEventMap {
    [key: string]: LVListener[];
}

export class EventHandler
{
    private events : UIEventMap;
    private listenerId : number;
    properties : UIEventMap;

    constructor()
    {
        this.events = {};
        this.properties = {};
        this.listenerId = 0;
    }

    private registerListenerToMap(map: UIEventMap, listener : LVListener) : void
    {
        var p = map[listener.name];
        if (p === undefined)
        {
            p = map[listener.name] = [];
        }
        this.listenerId += 1;
        listener.id = this.listenerId;
        p.push(listener);
    }

    private removeListenerFromMap(map: UIEventMap, listener : LVListener)
    {
        var p = map[listener.name];
        if (p === undefined)
        {
            p = map[listener.name] = [];
        }
        var i;
        for (i = 0; i < p.length; i += 1)
        {
            if (p[i].id === listener.id)
            {
                p.splice(i, 1);
                return true;
            }
        }
        throw Error("No listener with id " + listener.id + " found...");
        //return false;
    }
    
    triggerEvent(name : LVUIEvent, value? : any)
    {
        var p = this.events[name];
        var i : number;
        for (i = 0; i < p.length; i += 1)
        {
            p[i].callback(value);
        }
    }

    propertyChange(property : LVUIProperty, valueStr : string, value : any, tag : string)
    {
        var p = this.properties[property];
        var i : number;
        for (i = 0; i < p.length; i += 1)
        {
            if (tag.length === 0 || p[i].tag === tag)
            {
                if (p[i].prevValueStr !== valueStr)
                {
                    p[i].prevValueStr = valueStr;
                    p[i].callback(value);
                }
            }
        }
    }
    
    register(listeners : LVListenerList)
    {
        var i;
        for (i = 0; i < listeners.list.length; i += 1)
        {
            var map = listeners.list[i].listenerType === "EVENT" ? this.events : this.properties;
            this.registerListenerToMap(map, listeners.list[i]);
        }
    }

    clean(listeners : LVListenerList)
    {
        var i;
        for (i = 0; i < listeners.list.length; i += 1)
        {
            var map = listeners.list[i].listenerType === "EVENT" ? this.events : this.properties;
            this.removeListenerFromMap(map, listeners.list[i]);
        }
    }
}

export class LVListenerList
{
    list : LVListener[];
    tag : string;

    constructor(tag : string)
    {
        this.list = [];
        this.tag = tag;
    }

    setProperties(values : any)
    {
        var i;
        for (i = 0; i < this.list.length; i += 1)
        {
            var item = this.list[i];
            if (item.listenerType === "PROPERTY")
            {
                item.callback(values[item.name]);
            }
        }
    }

    onPropertyChange(name : LVUIProperty, callback : UIChangeCallback)
    {
        this.list.push(new LVListener("PROPERTY", this.tag, name, callback));
    }
    onEvent(name : LVUIEvent, callback : UIChangeCallback)
    {
        this.list.push(new LVListener("EVENT", this.tag, name, callback));
    }
}
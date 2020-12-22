
export type UIChangeCallback = (value : any) => void;

export type LVUIProperty =
    "playerDetails"
    | "hand"
    | "discardedCardTotals"
    | "playerId"
    | "gameState"
    | "username"
    | "roomcode";

export type LVUIEvent =
    "leaveRoom"
    | "connectionError"
    | "joinRoom";

type LVListenerType = "PROPERTY" | "EVENT";
export class LVListener
{
    name : string;
    id : number;
    callback : UIChangeCallback;
    listenerType : LVListenerType;

    constructor(listenerType: LVListenerType, name : string, callback : UIChangeCallback)
    {
        this.listenerType = listenerType;
        this.name = name;
        this.callback = callback;
        this.id = -1;
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
        return false;
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

    propertyChange(property : LVUIProperty, value : any)
    {
        var p = this.properties[property];
        var i : number;
        for (i = 0; i < p.length; i += 1)
        {
            p[i].callback(value);
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

    constructor()
    {
        this.list = [];
    }

    onPropertyChange(name : LVUIProperty, callback : UIChangeCallback)
    {
        this.list.push(new LVListener("PROPERTY", name, callback));
    }
    onEvent(name : LVUIEvent, callback : UIChangeCallback)
    {
        this.list.push(new LVListener("EVENT", name, callback));
    }
}
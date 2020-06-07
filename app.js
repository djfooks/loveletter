

var App = function ()
{
    this.responseText = document.getElementById("responseText");
    this.responseText.value = "";


    this.localStorage = window.localStorage;

    this.key = this.localStorage.getItem('key');
    if (!this.key)
    {
        this.key = Math.floor(Math.random() * 9999999);
        this.localStorage.setItem('key', this.key);
    }

    this.roomCodeInput = document.getElementById("roomCodeInput");
    var roomCode = this.localStorage.getItem('room');
    if (roomCode)
    {
        this.roomCodeInput.value = roomCode;
    }

    var name = this.localStorage.getItem('name');
    this.nameInput = document.getElementById("nameInput");
    if (name)
    {
        this.nameInput.value = name;
    }

    this.websocket = null;
};

App.prototype.createRoom = function ()
{
    var that = this;
    var xhr = new XMLHttpRequest();
    function reqListener ()
    {
        try
        {
            var data = JSON.parse(xhr.response);
            that.roomCode = data.room;
            that.roomCodeInput.value = that.roomCode;
        }
        catch (e)
        {
        }
    }

    xhr.onload = reqListener;
    xhr.open("GET", 'https://bzlzgmgcuh.execute-api.eu-west-2.amazonaws.com/default/loveletter-create');
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send();
};

App.prototype.connect = function ()
{
    this.localStorage.setItem('name', this.nameInput.value);
    this.localStorage.setItem('room', this.roomCodeInput.value);
    this.websocket = new WebSocket("wss://u72xrovjcj.execute-api.eu-west-2.amazonaws.com/test?room=" + this.roomCodeInput.value + "&key=" + this.key + "&name=" + this.nameInput.value);

    var that = this;
    this.websocket.onopen = function (event) {
        that.responseText.value = "Websocket connected...";
    };
    this.websocket.onmessage = function (event) {
        that.onmessage(event.data);
    };
};

App.prototype.start = function ()
{
    this.websocket.send(JSON.stringify({ "room": this.roomCodeInput.value, "cmd": "START" }));
};

App.prototype.onmessage = function (strData)
{
    this.responseText.value += "\n" + strData;
};

var app = new App();

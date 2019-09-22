var express = require('express');
var app = express();
var serv = require('http').Server(app);
 const fetch = require("node-fetch");
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
 
serv.listen(process.env.PORT);
console.log("Server started.");

//string constants for string emmision
const serverGeneratedString = "Fun fact: ";
const playerRequested1 = "(";
const playerRequested2 = " asks about: ";
const playerRequested3 = ") -";
const secondsIntervals = 20000;
let playerCount = 0;
var manageRequest = function(userNum, num, cb){
	const baseURL = 'http://numbersapi.com/';
	var number = num;
	//setup array of potential types of math facts
	var typeArray = ["/math"];
	var type =  typeArray[Math.floor(Math.random()*typeArray.length)];
	var requestString = baseURL+number+type;
	//fetch using built url
	fetch(requestString)
	 .then(response => response.text())
  	  .then(data => {
    // Here's a list of repos!
    	cb(userNum,num,data);
  		});
}
var Entity = function(){
    var self = {
        id:"",
        number:0,
    }
    return self;
}

var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = Math.floor(Math.random() * 500);
    Player.list[id] = self;
    return self;
}
Player.list = {};

Player.onConnect = function(socket){
    var player = Player(socket.id);
    socket.emit("playerNumber",player.number);
    playerCount++;
 	for(var i in SOCKET_LIST){
     	SOCKET_LIST[i].emit('playerCount',playerCount);
     }
}

Player.onDisconnect = function(socket){
	playerCount--;
    delete Player.list[socket.id];
     for(var i in SOCKET_LIST){
     	SOCKET_LIST[i].emit('playerCount',playerCount);
     }
}

//writes the response out to users
var handleRequestResponse = function(userIDNum,numVal, responseValue) {
	var stringToEmit = "";
	if (userIDNum == -1) {	
		stringToEmit = serverGeneratedString + responseValue;
	} else {
		stringToEmit = playerRequested1 + userIDNum + playerRequested2 +numVal+playerRequested3+ responseValue;
	}
     for(var i in SOCKET_LIST){
        SOCKET_LIST[i].emit('addToChat',stringToEmit);
     }
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
   
    Player.onConnect(socket);
   
    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMsgToServer',function(data){
        var playerName = Player.list[socket.id].number;
        for(var i in SOCKET_LIST){
        	SOCKET_LIST[i].emit('playerCount',playerCount);
            SOCKET_LIST[i].emit('addToChat',"["+playerName+"]" + ': ' + data);
        }
    });
    socket.on('sendCmdToServer',function(data){
    	if (isNaN(data) == false){
    		manageRequest(Player.list[socket.id].number,data,handleRequestResponse);
    	}        
    });
});


var SOCKET_LIST = {};

setInterval(function(){
    manageRequest(-1, Math.floor(Math.random() * 500), handleRequestResponse);
},secondsIntervals);
 
var PORT = process.env.PORT || 443 ;
var __express = require('express');
var app = __express();
var __http = require('http').Server(app);
var io = require('socket.io')(__http);
var __moment = require('moment');
var clientInfo = {};


var pg = require('pg');
var username = "aiiiluselxdxve";
var pass = "feecf1b6ab3c31aaa113b0a271c72b8f2e50c9cf7c6b40235960c47650ae308c";
var host = "ec2-54-225-99-171.compute-1.amazonaws.com";
var port = 5432;
var database = "d4gfak5ci5trl5";
var connString = "postgres://"+username+":"+pass+"@"+host=":"+port+"/"+database;

var client = new pg.Client(connString);
var result = client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';");
var firstM;
result.on('row',function(row){
    firstM = row;
});
result.on('end', function() {
    client.end();
});


app.use(__express.static(__dirname + '/public'));

function sendcurrentusers(socket) 
{
    var info = clientInfo[socket.id];
    var users = [];
    if(typeof info === 'undefined') return;
    Object.keys(clientInfo).forEach(function(socketId) {
        var userInfo = clientInfo[socketId];
        if(userInfo.room === info.room) {
           users.push(userInfo.name);
        }
    });
    
    socket.emit('message', {
        name: 'OctoKitty',
        text: firstM + 'Current users: ' + users.join(', '),
        timeStamp: __moment().valueOf()
    });
}

io.on('connection', function(socket) {
    //console.log("USER CONNECTED via SOCKET");
    
    socket.on('disconnect', function() {
        if(typeof clientInfo[socket.id] !== 'undefined') {
            socket.leave(clientInfo[socket.id].room);
            io.to(clientInfo[socket.id].room).emit('message', {
                name: 'Samantha',
                text: clientInfo[socket.id].name + ' has left!',
                timeStamp: __moment().valueOf()
            });
            delete clientInfo[socket.id];
        }
    });
    socket.on('joinRoom', function(request) {
        clientInfo[socket.id] = request;
        socket.join(request.room);
        //console.log(clientInfo[socket.id].room);
        socket.broadcast.to(request.room).emit('message', {
            name: 'Samantha',
            text: request.name + ' has joined!',
            timeStamp: __moment().valueOf()
        });
    });
    
    socket.on('message', function(message) {
        message.timeStamp = __moment().valueOf();
        if(message.text === '@currentUsers') {
            sendcurrentusers(socket);
        } else {
            //console.log("Message received: " + message.text);
            io.to(clientInfo[socket.id].room).emit('message', message);
        }
    });

    socket.emit('message', {
        name: 'Samantha',
        text: 'Hello from the server\'s side',
        timeStamp: __moment().valueOf()
    });
});

__http.listen(PORT,  function() {
    console.log("SERVER STARTED");
});
//io.set('transports',['websocket']);


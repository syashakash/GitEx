var PORT = process.env.PORT || 443 ;
var __express = require('express');
var app = __express();
var __http = require('http').Server(app);
var io = require('socket.io')(__http);
var __moment = require('moment');
var clientInfo = {};
var passport = require('passport');

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());


var GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
    clientID: 'f2213f5b59ec03df0871',
    clientSecret: 'be8cc9a944f095d3b6e2bed59f74de5eecb421c7',
    callbackURL: "https://pacific-thicket-12601.herokuapp.com/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

/*
var pg = require('pg');
var connString = "postgres://aiiiluselxdxve:feecf1b6ab3c31aaa113b0a271c72b8f2e50c9cf7c6b40235960c47650ae308c@ec2-54-225-99-171.compute-1.amazonaws.com:5432/d4gfak5ci5trl5";

var client = new pg.Client(connString);
var result = client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';");
var firstM;
result.on('row',function(row){
    firstM = row;
});
result.on('end', function() {
    client.end();
});
*/

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
        text: 'Current users: ' + users.join(', '),
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


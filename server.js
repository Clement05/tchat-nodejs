var http = require('http');

var fs = require('fs');

var md5 = require('MD5');

// Chargement du fichier index.html affiché au client

var httpServer = http.createServer(function(req, res) {

		fs.readFile('index.html', 'utf-8', function(error, content) {

        res.writeHead(200, {"Content-Type": "text/html"});

        res.end(content);

        });

    console.log("Un utilisateur à affiché la page");

});

httpServer.listen(1337);

// Chargement de socket.io

var io = require('socket.io').listen(httpServer);
var users = {};

// Quand un client se connecte, on le note dans la console

io.sockets.on('connection', function (socket) {

	var me = false;

    console.log('Nouvel utilisateur !');

    for(var k in users){

    	socket.emit('newuser', users[k]);

    }
    //gestion des messages
    socket.on('newmsg', function(message){
    	console.log(message);

    	message.user = me;
    	date = new Date();
    	message.h = date.getHours();
    	message.m = date.getMinutes();
    	io.sockets.emit('newmsg', message);
    	console.log(message);
    })



    //gestion des log
    socket.on('login', function(user){
    	console.log(user);
    	me = user;
    	me.id = user.email.replace('@', '-').replace('.','-');
    	me.avatar = 'https://gravatar.com/avatar/' + md5(user.email) + '?s=50';

    	users[me.id] = me;

    	//socket.broadcast.emit('newuser', me);
    	io.sockets.emit('newuser', me);
    });

    socket.on('disconnect', function(){
    	console.log("deconnexion");

    	if(!me){
    		return false;

    	}
    	delete users[me.id];
    	io.sockets.emit('disuser', me)
    })

});




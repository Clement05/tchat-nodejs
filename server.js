var http = require('http');

var fs = require('fs');

var md5 = require('MD5');

var mysql = require('mysql');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'gchat',
	password: 'Grenoble',
	database: 'gchat'
});

connection.connect(function(err){
	if(err){
		console.error(err);
	}else{
		console.log("Connected to MySQL");
	}
});
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
    
	connection.query('SELECT * FROM users WHERE email = ?', [me.email], function(err, rows, fields){

		
		if(rows.length === 1 && rows[0].token === me.token){
    			message.user = me;
    			date = new Date();
    			message.h = date.getHours();
    			message.m = date.getMinutes();
    			io.sockets.emit('newmsg', message);
    			console.log(message);
		}else{
			socket.emit('error', err);
		}
	});    
})



    //gestion des log
    socket.on('login', function(user){
	console.log("Trying to connect user "+user.email);
	connection.query('SELECT * FROM users WHERE email = ?', [user.email], function(err, rows, fields){
		if(err){
			console.error(err)
			socket.emit('error', err);
		}
		var pwd = md5(user.password);
		console.log(pwd);
		if(rows.length === 1 && (rows[0].pwd === pwd || rows[0].token == user.token)){
			
		    	console.log("User " + user.email + " is connected");
    			var d = new Date();
			var token = md5(d+user.email);
			me = {};
			me.token = token;
    			me.email = user.email;
			me.id = user.email.replace('@', '-').replace(/\./g,'-');;
    			me.avatar = 'https://gravatar.com/avatar/' + md5(user.email) + '?s=50';
			
			var update = connection.query('UPDATE users SET token = ? WHERE id = ?', [token, rows[0].id], function(err1, fields1){
				console.log(token);
			});
			console.log(update.sql);

			var addUser = true;
    			for(var k in users){
    				console.log("list of user "+k);
				console.log("id of new user "+me.id);
				if (k ==  me.id){
					console.log("the user is already connected");
					addUser = false;
				}
    			}
			if(addUser === true){
				users[me.id] = me;
				socket.emit('me',me);
    				io.sockets.emit('newuser', me);
			}	

    			//socket.broadcast.emit('newuser', me);
    			//io.sockets.emit('newuser', me);
		}else{
			console.log("Insert new user " +user.email+ " in database");
			var pwd = md5(user.password);
			var insertUser = {nickname: user.email, email: user.email, pwd: pwd};
			console.log(insertUser);
			var query = connection.query('INSERT INTO users SET ?', insertUser, function(err, rows, fields){
				//console.log(err.code);
			});
			//console.log(query.sql);
		}
	});
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




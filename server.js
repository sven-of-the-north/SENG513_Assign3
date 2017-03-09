var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
var clients = new Map();
var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var chatHistory = [];
var io = require('socket.io').listen(app.listen(port));

app.set('views', __dirname +'/pug');
app.set('view engine', "pug");
app.engine('pug', require('pug').__express);
app.use(express.static(__dirname + '/webClient'));

app.get("/", function( req, res ) {
	res.render("page");
});

io.sockets.on('connect', function(socket) {
	var name = generateUsername();
	clients.set(name, socket);
	
	socket.emit('serverMessage', { 
		timestamp: getTimestamp(),
		message: 'Welcome to the chat! You have been auto-assigned the username: ' + name + ".",
		autoUsername: name,
		userList: generateUserList()
	});
	
	socket.broadcast.emit('serverMessage', {
		timestamp: getTimestamp(),
		message: '<i>' + name + '</i> has joined the room.',
		userList: generateUserList()
	});
	
	console.log("User connected:" + name);
});

io.sockets.on('connection', function(socket) {
	socket.on('message', function(data) {
		console.log( "message received:" + data.message );
		switch ( parseMessage(data.message) ) {
			case 0:	//bad server command
				break;
			case 1:	//server command
				break;
			case 2:	//regular message
				chatHistory.push( data.message );
				data.timestamp = getTimestamp();
				console.log( "sending message: " + data.message );
				io.sockets.emit('message', data);
				break;
		}
	});
});

io.sockets.on('disconnect', function() {
	let deadUser = '';
		for ( let [userId, connection] of clients ) {
			if ( socket == connection ) {
				deadUser = userId;
				clients.delete(userId);
				console.log("User disconnected: " + deadUser);
				break;
			}
		}
	
	io.sockets.emit('serverMessage', {
		timestamp: getTimestamp(),
		message: '<i>' + deadUser + '</i> has left the room.',
		userList: generateUserList()
	});
});

getTimestamp = function () {
	let date = new Date();
	let hh = date.getHours();
	if ( hh < 10 )
		hh = '0' + hh;
	
	let mm = date.getMinutes();
	if ( mm < 10 )
		mm = '0' + mm;
	
	let ss = date.getSeconds();
	if ( ss < 10 )
		ss = '0' + ss;
	
	return hh + ":" + mm + ":" + ss;
};

generateUsername = function () {
    let text = "";

    for( var i=0; i < 5; i++ )
        text += charSet.charAt(Math.floor(Math.random() * charSet.length));

	while( clients.has(text) )	
		text = generateUsername(); //possible dangerous recursion? seems unlikely
	
    return text;
};

generateUserList = function () {
	let userList = [];
	for ( let[userId, socket] of clients )
		userList.push(userId);
	
	return userList.sort();
};

parseMessage = function( message ) {
	if ( message.match('^\/') ) {
		let tokens = message.split(" ");
		switch( tokens[0] ) {
			case '/nick':
				break;
			case '/nickcolor':
				break;
			default:
				return 0;
		}
	}
	return 2;
};
console.log("Listening on port " + port);

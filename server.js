var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
var clients = new Map();
var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

app.set('views', __dirname +'/pug');
app.set('view engine', "pug");
app.engine('pug', require('pug').__express);
app.use(express.static(__dirname + '/webClient'));

app.get("/", function( req, res ) {
	res.render("page");
});

var io = require('socket.io').listen(app.listen(port));
io.sockets.on('connection', function(socket) {
	var name = generateUsername();
	clients.set(name, socket);
	
	socket.emit('serverMessage', { 
		timestamp: getTimestamp(),
		message: 'Welcome to the chat! You have been auto-assigned the username: ' + name + ".",
		autoUsername: name,
		userList: generateUserList()
	});
	console.log("User connected:" + name);
	
	io.sockets.emit('serverMessage', {
		timestamp: getTimestamp(),
		message: '<i>' + name + '</i> has joined the room.',
		userList: generateUserList()
	})
	
	socket.on('send', function(data) {
		data.timestamp = getTimestamp();
		io.sockets.emit('message', data);
	});
	
	socket.on('disconnect', function() {
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
		})
	})
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

console.log("Listening on port " + port);

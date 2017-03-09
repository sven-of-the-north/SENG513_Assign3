var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var io = require('socket.io').listen(app.listen(port));

app.set('views', __dirname + '/pug');
app.set('view engine', "pug");
app.engine('pug', require('pug').__express);
app.use(express.static(__dirname + '/webClient'));

var clients = new Map();
var currentUsers = [];
var chatHistory = [];

app.get("/", function (req, res) {
	res.render("page");
});

io.sockets.on('connect', function (socket) {
	var name = generateUsername();
	clients.set(socket, {
		username: name,
		color: '#000000'
	});

	generateUserList();

	socket.emit('serverMessage', {
		timestamp: getTimestamp(),
		message: 'Welcome to the chat! You have been auto-assigned the username: ' + name + ".",
		username: name,
		userList: currentUsers,
		chatHistory: chatHistory
	});

	socket.broadcast.emit('serverMessage', {
		timestamp: getTimestamp(),
		message: '<i>' + name + '</i> has joined the room.',
		userList: currentUsers
	});

	console.log("User connected:" + name);
});

io.sockets.on('connection', function (socket) {
	socket.on('message', function (data) {
		console.log("Message received: '" + data.message + "' from: " + data.username);
		if (data.message.startsWith('/')) {
			handleServerCommand(socket, data.message);
		} else {
			chatHistory.push(data);
			data.timestamp = getTimestamp();
			console.log("Broadcasting message: " + data.message);
			io.sockets.emit('message', data);
		}
	});

	socket.on('disconnect', function () {
		let deadUser = clients.get(socket).username;

		if (!clients.has(socket)) {
			console.log("Attempted to disconnect a user that was not logged...?");
			return;
		}

		clients.delete (socket);
		console.log("User disconnected:" + deadUser);

		generateUserList();

		io.sockets.emit('serverMessage', {
			timestamp: getTimestamp(),
			message: '<i>' + deadUser + '</i> has left the room.',
			userList: currentUsers
		});
	});
});

getTimestamp = function () {
	let date = new Date();
	let hh = date.getHours();
	if (hh < 10)
		hh = '0' + hh;

	let mm = date.getMinutes();
	if (mm < 10)
		mm = '0' + mm;

	let ss = date.getSeconds();
	if (ss < 10)
		ss = '0' + ss;

	return hh + ":" + mm + ":" + ss;
};

generateUsername = function () {
	let text = "";

	for (var i = 0; i < 7; i++)
		text += charSet.charAt(Math.floor(Math.random() * charSet.length));
	while (clients.has(text))
		text = generateUsername(); //possible dangerous recursion? seems unlikely

	return text;
};

generateUserList = function () {
	currentUsers = [];

	for (let[socket, info]of clients)
		currentUsers.push(info.username);

	currentUsers.sort();
};

handleServerCommand = function (socket, message) {
	console.log("Handling server command: " + message);
	let tokens = message.split(' ');
	switch (tokens[0].toLowerCase()) {
	case '/nick':
		handleChangeNickname(socket, tokens);
		break;
	case '/nickcolor':
		handleChangeNickColor(socket, tokens);
		break;
	default:
		console.log("badCommand: " + message);
		socket.emit('serverMessage', {
			timestamp: getTimestamp(),
			message: "What? I didn't understand that command. <br>Currently supported commands: <br>'/nick' <br>'/nickcolor'"
		});
	}
};

handleChangeNickname = function (socket, tokens) {
	if (tokens.length < 2) {
		console.log("No new nickname supplied");
		socket.emit('serverMessage', {
			timestamp: getTimestamp(),
			message: "You didn't supply a new username!"
		});
	} else {
		let userInfo = clients.get(socket);
		let oldName = userInfo.username;
		if (/[\W]/.test(tokens[1]) || tokens[1].trim().length === 0) {
			console.log("Bad nickname change request: " + tokens[1]);
			socket.emit('serverMessage', {
				timestamp: getTimestamp(),
				message: "Your nickname must contain only alphanumeric characters"
			});
		} else {
			userInfo.username = tokens[1];
			socket.emit('serverMessage', {
				timestamp: getTimestamp(),
				username: tokens[1],
				message: "Successfully changed nickname to " + tokens[1]
			});

			generateUserList();

			socket.broadcast.emit('serverMessage', {
				timestamp: getTimestamp(),
				message: '<i>' + oldName + '</i> is now known as <i>' + userInfo.username + '</i>',
				userList: currentUsers
			});
			console.log("Setting nickname for " + oldName + " to " + tokens[1]);
		}
	}
};

handleChangeNickColor = function (socket, tokens) {
	if (tokens.length < 2) {
		console.log("No new colour supplied");
		socket.emit('serverMessage', {
			timestamp: getTimestamp(),
			message: "You didn't supply a new nickcolor!"
		});
	} else {
		let userInfo = clients.get(socket);
		let newColor = tokens[1].match(/(^#[0-9a-fA-F]{6})/g);
		if (!newColor) {
			console.log("Bad nickcolor change request: " + tokens[1]);
			socket.emit('serverMessage', {
				timestamp: getTimestamp(),
				message: "That's not a color! Use the form '#FFFFFF' to pick a color!"
			});
		} else {
			userInfo.color = newColor[0];
			socket.emit('serverMessage', {
				timestamp: getTimestamp(),
				color: userInfo.color,
				message: "Successfully changed color to <font color=\"" + newColor + "\">" + newColor + "</font>"
			});

			console.log("Setting color for " + userInfo.username + " to " + newColor);
		}
	}
};

console.log("Listening on port " + port);

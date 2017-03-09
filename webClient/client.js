var socket = io();
var myName = "";
var userList = [];

$(function () {
	sendMessage = function () {
		socket.emit('message', {
			username: myName,
			message: $('#textField').val()
		});
		$('#textField').val('');
	};

	$("#textField").keyup(function (e) {
		if (e.keyCode == 13) {
			sendMessage();
		}
	});

	$("#sendButton").click(function () {
		sendMessage();
	});

	buildMessageString = function (data) {
		return '<b><i>' + data.timestamp + '</i> | ' + data.username + ": </b>" + data.message;
	}

	socket.on('message', function (data) {
		$('#messageList').append($('<li>').html(buildMessageString(data)));
	})

	socket.on('serverMessage', function (data) {
		handleServerMessage(data);
	});
});

handleServerMessage = function (data) {
	if (data.userList) 
		userList = data.userList;
	if (data.username) 
		myName = data.username;		
	if (data.message) {
		data.username = 'Server'
		$('#messageList').append($('<li>').html(buildMessageString(data))).css("color", "red");
	}
}

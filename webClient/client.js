var socket = io();
var myName = "";
var myColor = '#000000';
var userList = [];

$(function () {
	socket.on('message', function (data) {
		$('#messageList').css('color', data.color).append($('<li>').html(buildMessageString(data)));
	});

	socket.on('serverMessage', function (data) {
		handleServerMessage(data);
	});

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
	};

	sendMessage = function () {
		socket.emit('message', {
			username: myName,
			color: myColor,
			message: $('#textField').val()
		});
		$('#textField').val('');
	};

	handleServerMessage = function (data) {
		if (data.userList)
			userList = data.userList;
		if (data.username)
			myName = data.username;
		if (data.color)
			myColor = data.color;
		if (data.chatHistory) {
			for ( let entry of data.chatHistory ) {
				$('#messageList').css('color', entry.color).append($('<li>').html(buildMessageString(entry)));
			}
		}
		if (data.message) {
			data.username = 'Server';
			$('#messageList').append($('<li>').css('color', "red").html(buildMessageString(data)));
		}
	};
});

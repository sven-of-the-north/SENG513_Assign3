var socket = io();
var myName = "";
var myColor = '#000000';

$(function () {
	socket.on('message', function (data) {
		$('#messageList').append($('<li>').html(buildMessageString(data)));
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
		let string = '';
		if (data.username === myName)
			string = '<b>' + data.timestamp + ' | <font color="' + data.color + '">' + data.username + "</font>: " + data.message + '</b>';
		else
			string = '<b>' + data.timestamp + ' | <font color="' + data.color + '">' + data.username + "</font>: </b>" + data.message;
		
		return string;
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
		if (data.username)
			myName = data.username;
		if (data.color)
			myColor = data.color;
		if (data.userList) {
			$('#userList').empty();
			for ( let user of data.userList ) {
				$('#userList').append($('<li>').html('<b><font color="' + user.color + '">' + user.username + '</font></b>'));
			}
		}
		if (data.chatHistory) {
			for ( let entry of data.chatHistory ) {
				$('#messageList').append($('<li>').html(buildMessageString(entry)));
			}
		}
		if (data.message) {
			data.username = 'Server';
			data.color = "red";
			$('#messageList').append($('<li>').css('color', "red").html(buildMessageString(data)));
		}
	};
});

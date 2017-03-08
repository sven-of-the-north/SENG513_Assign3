$(function() {
	var socket = io();
	var username = "";
	var userList = [];
	
	sendMessage = function () {
		socket.emit('send', { username: username, message: $('#field').val() });
		$('#field').val('');
	};
	
	$("#field").keyup(function(e) {
		if(e.keyCode == 13) {
			sendMessage();
		}
	});
	
	$("#sendButton").click(function() {
		sendMessage();
	});
	
	buildMessageString = function ( data ) {
		return '<b><i>' + data.timestamp + '</i> | ' + (data.username ? data.username : 'Server') + ": </b>" + data.message;
	}
	
	socket.on('message', function( data ) {
		$('#messageList').append($('<li>').html( buildMessageString( data ) ) );
	})
	
	socket.on('serverMessage', function( data ) {
		if ( data.autoUsername )
			username = data.autoUsername;
		if ( data.userList )
			userList = data.userList;
		if ( data.message )
			$('#messageList').append($('<li>').html( buildMessageString( data ) ) );
	})
	
});

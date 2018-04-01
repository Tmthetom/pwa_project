var socket = io.connect('https://pwa-moravec.herokuapp.com/');
var room = 'default';

// pro účely refreshe userlistu
socket.on('setCurrentRoom', function(current_room) {
room = current_room;
});

// spustí se po připojení
socket.on('connect', function(){
	socket.emit('addUser', prompt("What's your name?"));
});

// při aktualizaci chatu - zprávy, connect/disconnect, změna roomu
socket.on('updateChat', function (username, data) {
	var time = new Date();
	// čas + jméno + zpráva
	$('#conversation').append(("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2) +
	' - <b>'+username + ':</b> ' + data + '<br>');
});

// odkazy pro přepínání mezi roomy
socket.on('updateRooms', function(rooms, current_room) {
	$('#rooms').empty();
	$.each(rooms, function(key, value) {
		if(value == current_room){
			$('#rooms').append('<div class="roomName" id="currentRoom">' + value + '</div>');
		}
		else {
			$('#rooms').append('<div class="roomName"><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
		}
	});
});

// pro aktualizaci seznamu uživatelů
socket.on('updateUsers', function(users, current_room) {
	// když jsem ve stejném roomu, kde se provedla změna, provede se refresh
	if(current_room.valueOf() == room.valueOf()){
	$("#users").empty();
	$.each(users, function (key, value) {
	if(value == current_room){
	 $('#users').append('<div class="userName">' + key + '</div>');
	 }
	});};
});

// přepínání mezi roomy na serveru
function switchRoom(room){
	socket.emit('switchRoom', room);
}

// funkce tlačítka Send
$(function(){
	$('#messageSend').click( function() {
		var message = $('#messageField').val();
		$('#messageField').val('');
		socket.emit('sendChat', message);
	});

	$('#messageField').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#messageSend').focus().click();
		}
	});
});

// přepínání mezi roomy na serveru
function setFocusToMessageBox(){
	document.getElementById("messageField").focus();
}
// Global variables
var socket = io.connect('https://pwa-moravec.herokuapp.com/');
var room = 'default';
var lock = null;
var userToken = localStorage.getItem('userToken');
var accessToken = localStorage.getItem('accessToken');
var currentUser = localStorage.getItem('currentUser');

// First time connection
$(document).ready(function() {
	var options = {
		auth: {
			responseType: 'id_token token',
			access_type: 'offline',
		}
	};
	
	// User login (user authentication by Auth0)
	lock = new Auth0Lock('qQBp5GOeYQXFu9JXH96wApE20YzGn1yH', 'tmthetom.eu.auth0.com', options);  // Auth0
	
	// Connection (when user authenticated by Auth0)
	lock.on('authenticated', function(authResult) {
		lock.getUserInfo(authResult.accessToken, function(error, profile) {
			
			// Double check for errors
			if (error) {
				console.log('Cannot get user', error);
				return;        
			}
			
			// Create session for future connections
			localStorage.setItem('userToken', authResult.idToken);  // Store user token
			localStorage.setItem('accessToken', authResult.accessToken);  // Store access token
			//userToken = authResult.idToken;
			localStorage.setItem('userProfile', profile);  // Store user profile object
			//userProfile = profile;  // Save username in firs
			localStorage.setItem('currentUser', profile.name);  // Store username
			//currentUser = profile.name;

			// Reload page for open communication
			location.reload();
		});
	});

	// Connection not established
	if (userToken && accessToken) {
		lock.getUserInfo(accessToken, function (err, profile) {
			if (err) {
				return alert('There was an error getting the profile: ' + err.message);
			}        
			userProfile = profile;		
		});
	}
});

// Connection with existing token
socket.on('connect', function () {
	
	// Try to authenticate user
	socket.emit('authenticate', {token: userToken})
	
	// User authenticated!
    .on('authenticated', function () {
		
		// Show logout button
		var logoutButton = document.getElementById("logoutButton");
		logoutButton.style.display = "block";
    })
	
	// Not authenticated
    .on('unauthorized', function(msg) {
		openLockScreen();  // Show lock screen over page
    })
});

// Show Auth0 login
function login(){
  lock.show();
}

// Logout from Auth0
function logout() {
	localStorage.removeItem('userToken');  // Remove token
	localStorage.removeItem('accessToken');  // Remove token
	location.reload();  // Reload page to close communicator
	openLockScreen();  // Show lock screen over page
}

// Set users current room
socket.on('setCurrentRoom', function(current_room) {
	room = current_room;
});

// Update chat (new message, connection/disconnection, switch room)
socket.on('updateChat', function (username, data) {
	
	// Get date time now
	var time = new Date();
	
	// Show notification (time + name + message)
	$('#conversation').append(("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2) +
	' - <b>'+ username + ':</b> ' + data + '<br>');
	
	// Play notification sound
	if(username != currentUser){  // Only when not from current user
		notificationSound();
	}
	
	// Autoscroll in communication window
	updateScroll();
});

// Update room links (because current room does´t have link)
socket.on('updateRooms', function(rooms, current_room) {
	$('#rooms').empty();  // Empty current room list
	$.each(rooms, function(key, value) {
		
		// Current room (without link)
		if(value == current_room){
			$('#rooms').append('<div class="roomName" id="currentRoom">' + value + '</div>');
		}
		
		// Other rooms (with link)
		else {
			$('#rooms').append('<div class="roomName"><a href="#" onclick="switchRoom(\''+value+'\');setFocusToMessageBox()">' + value + '</a></div>');
		}
	});
});

// Update userlist
socket.on('updateUsers', function(users, current_room) {
	
	// Users in current room
	if(current_room.valueOf() == room.valueOf()){
	$("#users").empty();
	$.each(users, function (key, value) {
		if(value == current_room){
			$('#users').append('<div class="userName">' + key + '</div>');
		}
	});
	
	// All users
	$("#usersAll").empty();
	$.each(users, function (key, value) {
		$('#usersAll').append('<div class="userName">' + key + '</div>');
	});};
});

// Switch room
function switchRoom(room){
	socket.emit('switchRoom', room);
}

// Send message (button)
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

// Set focus on messagebox (when lost)
function setFocusToMessageBox(){
	document.getElementById("messageField").focus();
}

// Autoscroll in communication window
function updateScroll(){
    var element = document.getElementById("conversation");
    element.scrollTop = element.scrollHeight;
}

// Show lock screen layer over page
function openLockScreen(){
    var element = document.getElementById("lockForm");
    element.style.display = "block";
	var element = document.getElementById("wrapper");
    element.style.filter = "blur(7px)";
}

// Notification sound
function notificationSound() {
	var notification = document.getElementById("notificationSound"); 
    notification.play(); 
} 
var socket = io.connect('https://pwa-moravec.herokuapp.com/');
var room = 'default';
var lock = null;
var userToken = localStorage.getItem('userToken');
var accessToken = localStorage.getItem('accessToken');

$(document).ready(function() {
	var options = {
	  auth: {
		responseType: 'id_token token',
		access_type: 'offline',
	  }
	};
   lock = new Auth0Lock('qQBp5GOeYQXFu9JXH96wApE20YzGn1yH', 'tmthetom.eu.auth0.com', options);
   
   lock.on('authenticated', function(authResult) {
    lock.getUserInfo(authResult.accessToken, function(error, profile) {
		if (error) {
			console.log('Cannot get user', error);
			return;        
		}
        console.log('connected and authenticated');
        localStorage.setItem('userToken', authResult.idToken);
        localStorage.setItem('accessToken', authResult.accessToken);
		userToken = authResult.idToken;
        localStorage.setItem('userProfile', profile);
		userProfile = profile;
		
		var logoutButton = document.getElementById("logoutButton");
            logoutButton.style.display = "block";
			
		var loginButton = document.getElementById("loginButton");
		loginButton.style.display = "none";
		
		location.reload();  // aktualizace stránky
    });
});

if (userToken && accessToken) {
    lock.getUserInfo(accessToken, function (err, profile) {
        if (err) {
            return alert('There was an error getting the profile: ' + err.message);
        }        
        userProfile = profile;		
		
		var logoutButton = document.getElementById("logoutButton");
		logoutButton.style.display = "block";

		var loginButton = document.getElementById("loginButton");
		loginButton.style.display = "none";
    });
}
});

// tlačítko login
function login(){
  lock.show();
}

// tlačítko logout
function logout() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('accessToken');
  window.location.href = "/";  // aktualizace stránky
  openLockScreen();  // otevření přihlašovacího okna
}

// pro účely refreshe userlistu
socket.on('setCurrentRoom', function(current_room) {
room = current_room;
});

// připojení
socket.on('connect', function () {
  socket
    .emit('authenticate', {token: userToken})
    .on('authenticated', function () {
       console.log("authorized!!");
    })
    .on('unauthorized', function(msg) {
		openLockScreen();
		console.log("unauthorized");
      //console.log("unauthorized: " + JSON.stringify(msg.data));
      //throw new Error(msg.data.type);
    })
});

// při aktualizaci chatu - zprávy, connect/disconnect, změna roomu
socket.on('updateChat', function (username, data) {
	var time = new Date();
	// čas + jméno + zpráva
	$('#conversation').append(("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2) +
	' - <b>'+ username + ':</b> ' + data + '<br>');
	notificationSound();
	updateScroll();
});

// odkazy pro přepínání mezi roomy
socket.on('updateRooms', function(rooms, current_room) {
	$('#rooms').empty();
	$.each(rooms, function(key, value) {
		if(value == current_room){
			$('#rooms').append('<div class="roomName" id="currentRoom">' + value + '</div>');
		}
		else {
			$('#rooms').append('<div class="roomName"><a href="#" onclick="switchRoom(\''+value+'\');setFocusToMessageBox()">' + value + '</a></div>');
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
	});
	
	// refresh všech uživatelů
	$("#usersAll").empty();
	$.each(users, function (key, value) {
		$('#usersAll').append('<div class="userName">' + key + '</div>');
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

// posunutí scrollu chatovacího okna k nové zprávě
function updateScroll(){
    var element = document.getElementById("conversation");
    element.scrollTop = element.scrollHeight;
}

// otevření přihlašovacího okna
function openLockScreen(){
    var element = document.getElementById("lockForm");
    element.style.display = "block";
	var element = document.getElementById("wrapper");
    element.style.filter = "blur(7px)";
}

// notifikace nové zprávy
function notificationSound() {
	var notification = document.getElementById("notificationSound"); 
    notification.play(); 
} 
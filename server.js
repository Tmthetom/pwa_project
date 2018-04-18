// Express server settings
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
	socketioJwt = require('socketio-jwt');

// Start listening
server.listen(process.env.PORT || 8080);

// Express routing in directories
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use('/scripts', express.static(__dirname + '/scripts'));  // Frontend
app.use('/style', express.static(__dirname + '/style'));  // Custom CSS
app.use('/sound', express.static(__dirname + '/sound'));  // Notifications

// Global variables
var usernames = {};  // List of all users
var rooms = [  // List of all rooms
	'General',
	'School',
	'Work', 
	'Cars', 
	'Nature'
];

// Server functions (called only at first time connection)
io.sockets.on('connection', socketioJwt.authorize({
    secret: 'yeMuI7XLMwwYAhzCtgrGqBLjg9rI5-jpHHs-zCiSfO-O3wFBHHUR12N8z9yCDqvN', // Auth0 secret key
    timeout: 15000  // Connection lifetime

	// Connection (when user authenticated by Auth0)
	})).on('authenticated', function(socket) {
		
		// Connect user into default room
		socket.username = socket.decoded_token.name;  // Load user name from selected account
		socket.room = rooms[0];  // Set user default room
		usernames[socket.decoded_token.name] = socket.room;  // Add user in userlist
		socket.join(rooms[0]);  // Connect user into default room
		socket.emit('setCurrentRoom', socket.room);  // Inform client about room connection
		socket.emit('updateChat', 'SERVER', 'You have been connected to ' + socket.room);  // Inform user that he was connected
		socket.broadcast.to(socket.room).emit('updateChat', 'SERVER', socket.decoded_token.name + ' has connected to this room');  // Inform all users in room about new connection
		socket.emit('updateRooms', rooms, rooms[0]);  // Update client rooms links
		io.sockets.emit('updateUsers', usernames, socket.room);  // Update client room userlist


	// Send message (into current room)
	socket.on('sendChat', function (data) {
		io.sockets.in(socket.room).emit('updateChat', socket.username, data);
	});
	
	// Switch room
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);  // Leave old room
		socket.join(newroom);  // Join new room
		usernames[socket.username] = newroom;  // Change user current room in users list
		socket.emit('setCurrentRoom', newroom);  // Inform client about new current room
		io.sockets.emit('updateUsers', usernames, socket.room);  // Update user list in old room
		socket.emit('updateChat', 'SERVER', 'You have connected to '+ newroom);  // Inform user that he was reconnected
		socket.broadcast.to(socket.room).emit('updateChat', 'SERVER', socket.username+' has left this room');  // Inform all users in old room that user disconnected
		socket.room = newroom;  // Save new current room
		socket.broadcast.to(newroom).emit('updateChat', 'SERVER', socket.username+' has joined this room');  // Inform all users in room about new connection
		socket.emit('updateRooms', rooms, newroom);  // Update client rooms links
		io.sockets.emit('updateUsers', usernames, newroom);  // Update client room userlist
	});
	
    // Disconnection
	socket.on('disconnect', function(){
		delete usernames[socket.username];  // Delete user from userlist
		io.sockets.emit('updateUsers', usernames, socket.room);  // Update client room userlist
		socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');  // Inform all users in room that user disconnected
		socket.leave(socket.room);  // Disconnect from room
	});
});
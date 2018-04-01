// nastavení express.js
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server.listen(process.env.PORT || 8080);

// routing
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use('/scripts', express.static(__dirname + '/scripts'));

// definice globálních proměnných
var usernames = {};
var rooms = ['room1','room2','room3'];

// všechny eventy
io.sockets.on('connection', function (socket) {
	
	// přidání uživatele, volá se z frontendu
	socket.on('addUser', function(username){
		// jméno z promptu
		socket.username = username;
		// defaultní místnost
		socket.room = 'room1';
		// uloží se do globálního listu uživatelů
		usernames[username] = socket.room;
		// socket se připojí do defaultní místnosti
		socket.join('room1');	
		// uložíme informaci na klientovi
		socket.emit('setCurrentRoom', socket.room);
		// zpráva do chatu, že došlo k připojení (jen pro uživatele)
		socket.emit('updateChat', 'SERVER', 'you have connected to' + socket.room);
		// zpráva všem uživatelům v roomu1, že došlo k připojení
		socket.broadcast.to(socket.room).emit('updateChat', 'SERVER', username + ' has connected to this room');
		// aktualizace odkazů na roomy na klientovi
		socket.emit('updateRooms', rooms, 'room1');
		// aktualizace seznamu uživatelů - všichni uživatelé, provede se jen pro ty v současném roomu
		io.sockets.emit('updateUsers', usernames, socket.room);		
	});
	
	// posílání chatových zpráv, zpráva se pošle na sockety v současném roomu
	socket.on('sendChat', function (data) {
		io.sockets.in(socket.room).emit('updateChat', socket.username, data);
	});
	
	// přepínání roomu
	socket.on('switchRoom', function(newroom){
		
		// odpojení ze starého, připojení se k novému
		socket.leave(socket.room);
		socket.join(newroom);
		
		// uložíme info o novém roomu do globálního seznamu uživatelů
		usernames[socket.username] = newroom;
		// uložíme informaci na klientovi
		socket.emit('setCurrentRoom', newroom);
		// aktualizace seznamu uživatelů v starém roomu
		io.sockets.emit('updateUsers', usernames, socket.room);	
		// zpráva do chatu, že došlo k připojení (jen pro uživatele)
		socket.emit('updateChat', 'SERVER', 'you have connected to '+ newroom);	
		// zpráva všem uživatelům v starém roomu, že se odpojil uživatel
		socket.broadcast.to(socket.room).emit('updateChat', 'SERVER', socket.username+' has left this room');
		// uložíme proměnnou
		socket.room = newroom;
		// zpráva všem uživatelům v novém roomu, že došlo k připojení
		socket.broadcast.to(newroom).emit('updateChat', 'SERVER', socket.username+' has joined this room');
		// aktualizace odkazů na roomy na klientovi
		socket.emit('updateRooms', rooms, newroom);	
	    // aktualizace seznamu uživatelů v novém roomu
		io.sockets.emit('updateUsers', usernames, newroom);
	});
	
    // při odpojení
	socket.on('disconnect', function(){
		//smazat uživatele z globálního seznamu
		delete usernames[socket.username];
		//refresh user listu pro uživatele ve stejném roomu
		io.sockets.emit('updateUsers', usernames, socket.room);
		// zpráva všem uživatelům v roomu, že se odpojil uživatel
		socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');
		//odpojení socketu z roomu
		socket.leave(socket.room);
	});
});

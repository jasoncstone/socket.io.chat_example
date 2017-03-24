var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sockets = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.broadcast.emit('connection status', socket.id + " connected!");
  sockets[socket.id] = {};
  sockets[socket.id].socket = socket;

  socket.on('chat message', function(msg){
   socket.broadcast.emit('chat message', (sockets[socket.id].nick || socket.id) + ": " + msg); 
  });

  socket.on('msg', function(id, msg){
    var dest_socket;
    if(!sockets[id]){
      for(props in sockets){
        if(sockets[props].nick == id){
          dest_socket = sockets[props].socket;
        } 
      }
    }else{
    	dest_socket = sockets[id].socket;
    }

    if(dest_socket){
      dest_socket.emit("chat message", "<div id='private'>Private message from " + (sockets[socket.id].nick || socket.id) + ": " + msg + "</div>"); 
    }else{
      socket.emit("chat message", "Error: " + id + " could not be found!"); 
    }

  });

  socket.on('disconnect', function(msg){
    console.log('user disconnected');
    console.log(msg);
    io.emit('connection status', (sockets[socket.id].nick || socket.id) + " disconnected!");
  });
 
  socket.on('who', function(){
   io.clients(function(error, clients){
    var list = (sockets[clients[0]].nick || clients[0]); 
    for(var i=1; i<clients.length;i++){
       list = list + ", " + (sockets[clients[i]].nick || clients[i])
    }
    socket.emit('chat message', list); 
   }); 
  });

  socket.on('nick', function(nick){
    // Get the old nick - default to socket.id
    var oldNick = sockets[socket.id].nick || socket.id;
    
    // Save the new nick on our global sockets table
    sockets[socket.id].nick = nick;
    io.emit('chat message',oldNick + " changed name to " + nick);    
  });
  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

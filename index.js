var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var car = require('./car.js');

var connectedPlayers = 0;
var cars = {};
//console.log(carInstance.color);

/* ****************************************************************************** */
/* ******************************* ROUTER *************************************** */
/* ****************************************************************************** */

app.get('/', function(req, res){
  res.sendFile('/var/www/StockCar/index.html');
});


/* ****************************************************************************** */
/* ******************************* SOCKETS ************************************** */
/* ****************************************************************************** */

io.on('connection', function(socket){
  connectedPlayers++;
  var carInstance = new car();
  carInstance.id = socket.id;
  cars[carInstance.id] = carInstance;
  carInstance.color = getRandomColor();

  //console.log(carInstance.color);

  socket.on('newGame', function(msg){
    socket.emit('newGame', carInstance.color);
  });

  socket.on('changeColor', function(msg){
    socket.emit('changeColor', "red");
  });  
  
  socket.on('disconnect', function(){
    connectedPlayers--;
  	console.log(connectedPlayers);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

/* ****************************************************************************** */
/* ******************************* UTILITY ************************************** */
/* ****************************************************************************** */

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var car = require('./car.js');

var connectedPlayers = 0;
var cars = {};
var controls = {};

var mapWidth = 500;
var mapHeight = 500;
var carWidth = 10;
var carHeight = 20;

var maxPositionValueX = mapWidth - carWidth;
var maxPositionValueY = mapHeight - carHeight;

var minPositionValueX = carWidth;
var minPositionValueY = carHeight; 

/* ****************************************************************************** */
/* ******************************* ROUTER *************************************** */
/* ****************************************************************************** */

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/* ****************************************************************************** */
/* ******************************* SOCKETS ************************************** */
/* ****************************************************************************** */

io.on('connection', function(socket){
  connectedPlayers++;
  console.log(connectedPlayers);

  socket.on('launchGame', function(msg){
    var newCarInstance = new car();
    initCar(newCarInstance, socket);

    cars[newCarInstance.id] = newCarInstance;

    socket.emit('newGame', JSON.stringify(newCarInstance));
  });

  socket.on('updateControls', function(msg){
    controls[socket.id] = JSON.parse(msg);
  });

  socket.on('disconnect', function(){
    connectedPlayers--;
    delete cars[socket.id];
    delete controls[socket.id];
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

function initCar(CarInstance,socket) {
  ux = 1;
  uy = 0;
  CarInstance.id = socket.id;
  CarInstance.color = getRandomColor();
  CarInstance.width = carWidth;
  CarInstance.height = carHeight;
  CarInstance.x = Math.floor(Math.random() * (maxPositionValueX - minPositionValueX)) + minPositionValueX;
  CarInstance.y = Math.floor(Math.random() * (maxPositionValueY - minPositionValueY)) + minPositionValueY;
  CarInstance.vx = (mapWidth / 2) - CarInstance.x;
  CarInstance.vy = (mapHeight / 2) - CarInstance.y;
  vx = CarInstance.vx;
  vy = CarInstance.vy;
  u_scal_v = ux * vx + uy * vy;
  norm_u = Math.sqrt(Math.pow(ux,2)+Math.pow(uy,2));
  norm_v = Math.sqrt(Math.pow(vx,2)+Math.pow(vy,2));
  angle = u_scal_v/(norm_u*norm_v);
  if(vy < 0)
  {
    angle = -angle;
  }
  CarInstance.angle = Math.acos(angle);
}


/* ****************************************************************************** */
/* ******************************* GAME LOOP ************************************ */
/* ****************************************************************************** */

var updateloop = setInterval(function () {
        update();
    }, 40);

function update() {
  //console.log(JSON.stringify(cars));
  for (var idCar in cars){
    if(controls.hasOwnProperty(idCar)){

      var angle = 0;
      var speed = 6;

      if(controls[idCar].left == 1){
        angle -= Math.PI / 36;
      }
      if(controls[idCar].right == 1){
        angle += Math.PI / 36;
      }
      cars[idCar].angle += angle;
      normv = Math.sqrt(cars[idCar].vx * cars[idCar].vx + cars[idCar].vy * cars[idCar].vy);

      cars[idCar].vx = cars[idCar].vx * Math.cos(angle) - cars[idCar].vy * Math.sin(angle);
      cars[idCar].vy = cars[idCar].vx * Math.sin(angle) + cars[idCar].vy * Math.cos(angle);

      cars[idCar].vx = cars[idCar].vx / normv;
      cars[idCar].vy = cars[idCar].vy / normv;

      cars[idCar].x +=  speed * cars[idCar].vx;
      cars[idCar].y +=  speed * cars[idCar].vy;

      if(cars[idCar].x > mapWidth | cars[idCar].y > mapHeight |  cars[idCar].x < 0 | cars[idCar].y < 0){
          io.sockets.connected[idCar].emit('gameOver', 'dead!');
          delete cars[idCar];
          delete controls[idCar];
      }
      //console.log(cars[idCar].vx);
    }
  }

  io.emit('update', JSON.stringify(cars));
}

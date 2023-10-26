//fait appel au package espress qui permet de faire tourner le site
const { log } = require('console');
const express = require('express')
const app = express()

//socket.io setup
const http = require('http');
const { arch } = require('os');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { isArgumentsObject } = require('util/types');
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000});
//donne le port en local host
const port = 3000

//permet aux utilisateurs d'accéder au dossier public, qui est statique et ne bougera pas.
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}
const backEndProjectiles = {}
const SPEED = 10;
const RADIUS = 10;
const projectileSpeed = 10;
let projectileId = 0;

io.on('connection', (socket) => {
  console.log('a user connected');

  io.emit('updatePlayers', backEndPlayers)

  socket.on('shoot', ({x, y, angle}) => {
    const velocity = {
        x: Math.cos(angle) * projectileSpeed,
        y: Math.sin(angle) * projectileSpeed
    }

    backEndProjectiles[projectileId] = {
      x, 
      y, 
      velocity, 
      playerId: socket.id
    }
    projectileId++;

  })

  socket.on('initGame', ({username, width, height, devicePixelRatio}) => {
    console.log(username);
    backEndPlayers[socket.id] = {
      x: 500 * Math.random(),
      y:500 * Math.random(),
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username
    };
    //emit the canvas
    backEndPlayers[socket.id].canvas = {
      width,
      height,
    }
    backEndPlayers[socket.id].radius = RADIUS
    if (devicePixelRatio > 1) {
      backEndPlayers[socket.id].radius = 2 * RADIUS
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id];
    io.emit('updatePlayers', backEndPlayers)
  })
  
  socket.on('keydown', ({ key, sequenceNumber }) => {
    if (sequenceNumber) { 
      console.log(sequenceNumber);    
      backEndPlayers[socket.id]?.sequenceNumber = sequenceNumber
      switch (key) {
        case "z":
          backEndPlayers[socket.id].y -= SPEED;
          break;
          
        case "q":
          backEndPlayers[socket.id].x -= SPEED;
          break;
            
        case "s":
          backEndPlayers[socket.id].y += SPEED;
          break;
              
        case "d":
          backEndPlayers[socket.id].x += SPEED;  
          break;
    }
  }
  })
});

//backend ticker (what makes the game run every 15ms)
setInterval(() => {

  //update projectiles positions
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    const PROJECTILE_RADIUS = 5
    if (backEndProjectiles[id].x - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width || backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 || backEndProjectiles[id].y - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height || backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0) {
      delete backEndProjectiles[id];
      continue;
    }
    for (const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId];

      const DISTANCE = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x, 
        backEndProjectiles[id].y - backEndPlayer.y)
      
        //collision with another player
      if (DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius && backEndProjectiles[id].playerId !== playerId) {
        if (backEndPlayers[backEndProjectiles[id].playerId]) {
          backEndPlayers[backEndProjectiles[id].playerId].score++
        }
        delete backEndProjectiles[id] 
        delete backEndPlayers[playerId];
        break;
      }
    }
  }

  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)

}, 15)

          
          //affiche le message pour confirmer que l'application est ouverte.
          server.listen(port, () => {
            console.log(`Example app listening on port ${port}`)
          })
          
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const socket = io();

const scoreEl = document.querySelector('#scoreEl');

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const x = canvas.width / 2
const y = canvas.height / 2

// const player = new Player(x, y, 10, 'white')
const frontEndPlayers = {};
const frontEndProjectiles = {};

socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles){
    const backEndProjectile = backEndProjectiles[id];

    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x, 
        y: backEndProjectile.y, 
        radius: 5, 
        color: frontEndPlayers[backEndProjectile.playerId]?.color, 
        velocity: backEndProjectile.velocity
      })
    } else {

      frontEndProjectiles[id].x += backEndProjectile.velocity.x
      frontEndProjectiles[id].y += backEndProjectile.velocity.y
    }

    for (const frontEndProjectileId in frontEndProjectiles) {
      if (!backEndProjectiles[frontEndProjectileId]){
        delete frontEndProjectiles[frontEndProjectileId];
      }
    }
  }
})

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id];

    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({ 
        x: backEndPlayer.x, 
        y: backEndPlayer.y, 
        radius: 10, 
        color: backEndPlayer.color
      });

        document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">${backEndPlayer.username} : ${backEndPlayer.score}</div>`

    } else {

      //sort players in leaderboard
      document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backEndPlayer.username} : ${backEndPlayer.score}`

      document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backEndPlayer.score)

      const parentDiv = document.querySelector('#playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))
      
      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))

        return scoreB - scoreA
      })
      //remove old elements
      childDivs.forEach(div => {
        parentDiv.removeChild(div)
      })
      //add sorted elements
      childDivs.forEach(div => {
        parentDiv.appendChild(div)
      })

      //if a player already exists
      if(id === socket.id) { //only for our player
        frontEndPlayers[id].x = backEndPlayer.x;
        frontEndPlayers[id].y = backEndPlayer.y;

        

        const lastBackEndInputIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber;
        })

        if(lastBackEndInputIndex > -1){
          playerInputs.splice(0, lastBackEndInputIndex +1)
        }
        playerInputs.forEach((input) =>{
          frontEndPlayers[id].x += input.dx;
          frontEndPlayers[id].y += input.dy;
        })
      }
      else {
        // for all other players

        gsap.to(frontEndPlayers[id], {
          x: backEndPlayer.x, 
          y: backEndPlayer.y,
          duration: 0.015,
          ease: 'linear'
        })
      }
    }
  }

  // deleting players from front end
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]){
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)
      delete frontEndPlayers[id];

      if (id === socket.id) {
        document.querySelector('#usernameForm').style.display = 'block';
      }
    }
  }

})

let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]
    frontEndPlayer.draw();
  }
  
  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id]
    frontEndProjectile.draw();
  }

  //  
}

animate()


const keys = {
  z: {
    pressed: false
  },
  q: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

const speed = 10;
const playerInputs = []
let sequenceNumber = 0;

setInterval( () => {
  if (keys.z.pressed) {
    sequenceNumber++;
    playerInputs.push({sequenceNumber, dx: 0, dy: -speed})
    frontEndPlayers[socket.id].y -= speed;
    socket.emit('keydown', {key: 'z', sequenceNumber})
  }

  if (keys.q.pressed) {
    sequenceNumber++;
    playerInputs.push({sequenceNumber, dx: -speed, dy: 0})
    frontEndPlayers[socket.id].x -= speed;
    socket.emit('keydown', {key: 'q', sequenceNumber})
  }

  if (keys.s.pressed) {
    sequenceNumber++;
    playerInputs.push({sequenceNumber, dx: 0, dy: speed})
    frontEndPlayers[socket.id].y += speed;
    socket.emit('keydown', {key: 's', sequenceNumber})
  }

  if (keys.d.pressed) {
    sequenceNumber++;
    playerInputs.push({sequenceNumber, dx: speed, dy: 0})
    frontEndPlayers[socket.id].x += speed;
    socket.emit('keydown', {key: 'd', sequenceNumber})
  }
}, 15)


window.addEventListener('keydown', (event) => {
  if (!frontEndPlayers[socket.id]) return;

    switch (event.key) {
      case "z":
        keys.z.pressed = true
        break;

      case "q":
        keys.q.pressed = true;

        break;

      case "s":
        keys.s.pressed = true;

        break;

      case "d":
        keys.d.pressed = true;

        break;
    }

})

addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) return;
  
    switch (event.key) {
      case "z":
        keys.z.pressed = false;
        break;

      case "q":
        keys.q.pressed = false;
        break;


      case "s":
        keys.s.pressed = false;
        break;

      case "d":
        keys.d.pressed = false;
        break;
    }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  //éviter l'action de base de submit de rafraichir la page
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none';

  socket.emit('initGame', {
    username: document.querySelector('#usernameInput').value, 
    width: canvas.width, 
    height: canvas.height,
    devicePixelRatio
  })
})
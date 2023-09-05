addEventListener('click', (event) => {

    const speed = 15;

    const playerPosition = {
        x: frontEndPlayers[socket.id].x,
        y: frontEndPlayers[socket.id].y
    }

    const angle = Math.atan2(
        event.clientY * window.devicePixelRatio - playerPosition.y,
        event.clientX * window.devicePixelRatio - playerPosition.x
    )

    // const velocity = {
    //     x: Math.cos(angle) * speed,
    //     y: Math.sin(angle) * speed
    // }

    socket.emit('shoot', {
        x: playerPosition.x,
        y: playerPosition.y,
        angle,
    })

    // frontEndProjectiles.push(
    //     new Projectile({
    //         x: playerPosition.x, 
    //         y: playerPosition.y, 
    //         radius: 5, 
    //         color: 'white', 
    //         velocity})
    // )
})

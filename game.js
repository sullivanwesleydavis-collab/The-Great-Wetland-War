const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Pixel size for pixelated look
const pixelSize = 4;

// Colors for swamp elements
const colors = {
    water: '#1e3a5f',
    deepWater: '#0f1a2e',
    grass: '#2d5016',
    mud: '#4a3c28',
    treeTrunk: '#3d2817',
    treeLeaves: '#1a3d1a',
    fog: 'rgba(200, 220, 255, 0.3)',
    player: '#ff6b35',
    enemy: '#ff4757'
};

// Player
let player = {
    x: 50,
    y: 50,
    color: '#4CAF50', // Green for frog
    size: 2, // 2x2 pixels for frog sprite
    health: 100,
    maxHealth: 100
};

// Enemies
let enemies = [];

// Projectiles
let projectiles = [];

// Game state
let gameOver = false;
let gameWon = false;
let score = 0;

// Generate swamp terrain
function generateSwamp() {
    for (let y = 0; y < levelHeight; y++) {
        level[y] = [];
        for (let x = 0; x < levelWidth; x++) {
            // Create water bodies
            if (Math.random() < 0.4) {
                level[y][x] = Math.random() < 0.7 ? 'water' : 'deepWater';
            } else if (Math.random() < 0.6) {
                level[y][x] = 'grass';
            } else {
                level[y][x] = 'mud';
            }

            // Add some trees randomly
            if (level[y][x] === 'grass' && Math.random() < 0.05) {
                level[y][x] = 'tree';
            }
        }
    }

    // Add some enemy frogs
    enemies = [];
    for (let i = 0; i < 10; i++) {
        let ex, ey;
        do {
            ex = Math.floor(Math.random() * (levelWidth - 2)); // Leave space for 2x2 sprite
            ey = Math.floor(Math.random() * (levelHeight - 2));
            // Check if all 4 positions are valid
            let valid = true;
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    if (!isWalkable(ex + dx, ey + dy)) {
                        valid = false;
                        break;
                    }
                }
                if (!valid) break;
            }
        } while (!valid);
        enemies.push({ x: ex, y: ey, color: '#FF5722', size: 2, health: 50 }); // Red enemy frogs with health
    }
}

// Draw a pixel
function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Draw the level
function drawLevel() {
    const startX = Math.max(0, Math.floor(cameraX / pixelSize));
    const startY = Math.max(0, Math.floor(cameraY / pixelSize));
    const endX = Math.min(levelWidth, startX + Math.ceil(canvas.width / pixelSize) + 1);
    const endY = Math.min(levelHeight, startY + Math.ceil(canvas.height / pixelSize) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = level[y][x];
            let color = colors.mud; // default

            if (tile === 'water') color = colors.water;
            else if (tile === 'deepWater') color = colors.deepWater;
            else if (tile === 'grass') color = colors.grass;
            else if (tile === 'tree') {
                // Draw tree trunk and leaves
                drawPixel(x, y, colors.treeTrunk);
                if (y > 0) drawPixel(x, y - 1, colors.treeLeaves);
                continue;
            }

            drawPixel(x, y, color);
        }
    }

    // Draw enemies (enemy frogs)
    enemies.forEach(enemy => {
        if (enemy.x >= startX && enemy.x < endX && enemy.y >= startY && enemy.y < endY) {
            // Draw 2x2 enemy frog sprite
            for (let dy = 0; dy < enemy.size; dy++) {
                for (let dx = 0; dx < enemy.size; dx++) {
                    drawPixel(enemy.x + dx, enemy.y + dy, enemy.color);
                }
            }
            // Add eyes (yellow pixels for enemy frogs)
            drawPixel(enemy.x, enemy.y, '#FFFF00');
            drawPixel(enemy.x + 1, enemy.y, '#FFFF00');
        }
    });

    // Draw projectiles
    projectiles.forEach(proj => {
        if (proj.x >= startX && proj.x < endX && proj.y >= startY && proj.y < endY) {
            drawPixel(proj.x, proj.y, proj.color);
        }
    });
}

// Add some fog effect
function drawFog() {
    ctx.fillStyle = colors.fog;
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 20 + 10;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw UI (health, score, game over)
function drawUI() {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px monospace';
    
    // Health bar
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 10, 20);
    
    // Score
    ctx.fillText(`Score: ${score}`, 10, 40);
    
    // Game over/win messages
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF0000';
        ctx.font = '32px monospace';
        ctx.fillText('GAME OVER', canvas.width/2 - 100, canvas.height/2);
        ctx.font = '16px monospace';
        ctx.fillText('Press R to restart', canvas.width/2 - 60, canvas.height/2 + 30);
    } else if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00FF00';
        ctx.font = '32px monospace';
        ctx.fillText('YOU WIN!', canvas.width/2 - 80, canvas.height/2);
        ctx.font = '16px monospace';
        ctx.fillText(`Final Score: ${score}`, canvas.width/2 - 50, canvas.height/2 + 30);
        ctx.fillText('Press R to restart', canvas.width/2 - 60, canvas.height/2 + 50);
    }
}

// Camera position (follows player)
let cameraX = 0;
let cameraY = 0;

// Update camera to follow player
function updateCamera() {
    const screenX = player.x * pixelSize - cameraX;
    const screenY = player.y * pixelSize - cameraY;

    const margin = 100; // pixels from edge before camera moves

    if (screenX < margin) {
        cameraX = Math.max(0, player.x * pixelSize - margin);
    } else if (screenX > canvas.width - margin) {
        cameraX = Math.min((levelWidth * pixelSize) - canvas.width, player.x * pixelSize - (canvas.width - margin));
    }

    if (screenY < margin) {
        cameraY = Math.max(0, player.y * pixelSize - margin);
    } else if (screenY > canvas.height - margin) {
        cameraY = Math.min((levelHeight * pixelSize) - canvas.height, player.y * pixelSize - (canvas.height - margin));
    }
}

// Check if position is walkable
function isWalkable(x, y) {
    if (x < 0 || x >= levelWidth || y < 0 || y >= levelHeight) return false;
    const tile = level[y][x];
    return tile !== 'tree' && tile !== 'deepWater';
}

// Create projectile
function shootProjectile(x, y, dx, dy, color = '#FFFF00') {
    projectiles.push({
        x: x,
        y: y,
        dx: dx,
        dy: dy,
        color: color,
        size: 1
    });
}

// Update projectiles
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.dx;
        proj.y += proj.dy;

        // Remove if out of bounds
        if (proj.x < 0 || proj.x >= levelWidth || proj.y < 0 || proj.y >= levelHeight) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (Math.abs(proj.x - enemy.x) < enemy.size && Math.abs(proj.y - enemy.y) < enemy.size) {
                enemy.health -= 25; // Damage enemy
                projectiles.splice(i, 1);
                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    score += 100;
                }
                break;
            }
        }
    }
}

// Update enemies (simple AI - move towards player)
function updateEnemies() {
    enemies.forEach(enemy => {
        // Simple AI: move towards player occasionally
        if (Math.random() < 0.02) { // 2% chance per frame to move
            let dx = player.x - enemy.x;
            let dy = player.y - enemy.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                dx /= dist; // Normalize
                dy /= dist;
                
                let newX = enemy.x + Math.sign(dx);
                let newY = enemy.y + Math.sign(dy);
                
                // Check if new position is valid
                let canMove = true;
                for (let dy2 = 0; dy2 < enemy.size; dy2++) {
                    for (let dx2 = 0; dx2 < enemy.size; dx2++) {
                        if (!isWalkable(newX + dx2, newY + dy2)) {
                            canMove = false;
                            break;
                        }
                    }
                    if (!canMove) break;
                }
                
                if (canMove) {
                    enemy.x = newX;
                    enemy.y = newY;
                }
            }
        }

        // Check collision with player
        if (Math.abs(enemy.x - player.x) < enemy.size && Math.abs(enemy.y - player.y) < enemy.size) {
            player.health -= 1; // Damage player over time when touching
        }
    });
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver && !gameWon) {
        updateCamera();
        updateProjectiles();
        updateEnemies();
        
        // Check win/lose conditions
        if (player.health <= 0) {
            gameOver = true;
        } else if (enemies.length === 0) {
            gameWon = true;
        }
    }

    drawLevel();
    drawFog();
    drawUI();

    requestAnimationFrame(gameLoop);
}

// Initialize
generateSwamp();
gameLoop();

// Player movement with arrow keys and shooting with space
document.addEventListener('keydown', (e) => {
    if (gameOver || gameWon) {
        if (e.key === 'r' || e.key === 'R') {
            // Restart game
            player.health = player.maxHealth;
            score = 0;
            gameOver = false;
            gameWon = false;
            projectiles = [];
            generateSwamp();
        }
        return;
    }

    let newX = player.x;
    let newY = player.y;

    if (e.key === 'ArrowLeft') newX--;
    else if (e.key === 'ArrowRight') newX++;
    else if (e.key === 'ArrowUp') newY--;
    else if (e.key === 'ArrowDown') newY++;
    else if (e.key === ' ') { // Space bar to shoot
        // Shoot in the direction of last movement or towards nearest enemy
        let targetX = player.x + 1; // Default right
        let targetY = player.y;
        
        // Find nearest enemy
        let nearestDist = Infinity;
        let nearestEnemy = null;
        enemies.forEach(enemy => {
            const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });
        
        if (nearestEnemy) {
            targetX = nearestEnemy.x;
            targetY = nearestEnemy.y;
        }
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            shootProjectile(player.x + 1, player.y + 1, dx/dist * 3, dy/dist * 3);
        }
        return; // Don't move when shooting
    }

    // Check if all 4 pixels of the frog can move to the new position
    let canMove = true;
    for (let dy = 0; dy < player.size; dy++) {
        for (let dx = 0; dx < player.size; dx++) {
            if (!isWalkable(newX + dx, newY + dy)) {
                canMove = false;
                break;
            }
        }
        if (!canMove) break;
    }

    if (canMove) {
        player.x = newX;
        player.y = newY;
    }
});
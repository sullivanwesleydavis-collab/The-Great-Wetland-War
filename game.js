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
    size: 2 // 2x2 pixels for frog sprite
};

// Enemies
let enemies = [];

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
        enemies.push({ x: ex, y: ey, color: '#FF5722', size: 2 }); // Red enemy frogs
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

    // Draw player (frog sprite)
    if (player.x >= startX && player.x < endX && player.y >= startY && player.y < endY) {
        // Draw 2x2 frog sprite
        for (let dy = 0; dy < player.size; dy++) {
            for (let dx = 0; dx < player.size; dx++) {
                drawPixel(player.x + dx, player.y + dy, player.color);
            }
        }
        // Add eyes (white pixels)
        drawPixel(player.x, player.y, '#FFFFFF');
        drawPixel(player.x + 1, player.y, '#FFFFFF');
    }
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

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateCamera();
    drawLevel();
    drawFog();

    requestAnimationFrame(gameLoop);
}

// Initialize
generateSwamp();
gameLoop();

// Player movement with arrow keys
document.addEventListener('keydown', (e) => {
    let newX = player.x;
    let newY = player.y;

    if (e.key === 'ArrowLeft') newX--;
    else if (e.key === 'ArrowRight') newX++;
    else if (e.key === 'ArrowUp') newY--;
    else if (e.key === 'ArrowDown') newY++;

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
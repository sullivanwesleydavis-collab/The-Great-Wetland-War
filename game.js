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
    grass: '#2d5016',
    mud: '#4a3c28',
    treeTrunk: '#3d2817',
    treeLeaves: '#1a3d1a',
    player: '#4CAF50' // Green frog
};

// Simple level data
const levelWidth = 50;
const levelHeight = 38;
const level = [];

// Player
let player = {
    x: 25,
    y: 19,
    size: 2
};

// Generate simple swamp
function generateSwamp() {
    for (let y = 0; y < levelHeight; y++) {
        level[y] = [];
        for (let x = 0; x < levelWidth; x++) {
            // Simple pattern: water in corners, grass in middle
            if (x < 10 || x > 40 || y < 8 || y > 30) {
                level[y][x] = 'water';
            } else if (Math.random() < 0.8) {
                level[y][x] = 'grass';
            } else {
                level[y][x] = 'mud';
            }

            // Add some trees
            if (level[y][x] === 'grass' && Math.random() < 0.05) {
                level[y][x] = 'tree';
            }
        }
    }
}

// Draw a pixel
function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Draw the level
function drawLevel() {
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const tile = level[y][x];
            let color = colors.mud;

            if (tile === 'water') color = colors.water;
            else if (tile === 'grass') color = colors.grass;
            else if (tile === 'tree') {
                drawPixel(x, y, colors.treeTrunk);
                if (y > 0) drawPixel(x, y - 1, colors.treeLeaves);
                continue;
            }

            drawPixel(x, y, color);
        }
    }

    // Draw player (simple green square for now)
    drawPixel(player.x, player.y, colors.player);
}

// Check if position is walkable
function isWalkable(x, y) {
    if (x < 0 || x >= levelWidth || y < 0 || y >= levelHeight) return false;
    const tile = level[y][x];
    return tile !== 'tree' && tile !== 'water';
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    requestAnimationFrame(gameLoop);
}

// Initialize
generateSwamp();
gameLoop();

// Simple movement
document.addEventListener('keydown', (e) => {
    let newX = player.x;
    let newY = player.y;

    if (e.key === 'ArrowLeft') newX--;
    else if (e.key === 'ArrowRight') newX++;
    else if (e.key === 'ArrowUp') newY--;
    else if (e.key === 'ArrowDown') newY++;

    if (isWalkable(newX, newY)) {
        player.x = newX;
        player.y = newY;
    }
});</content>
<parameter name="filePath">/workspaces/The-Great-Wetland-War/game.js
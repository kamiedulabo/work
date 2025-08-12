import './index.css';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const messageContainer = document.getElementById('message-container') as HTMLDivElement;
const messageEl = document.getElementById('message') as HTMLHeadingElement;
const subMessageEl = document.getElementById('sub-message') as HTMLParagraphElement;


// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Skins
const PLAYER_SKIN = '🚀';
const INVADER_SKIN = '👾';
const BULLET_SKIN = '💧';
const INVADER_BULLET_SKIN = '🔥';

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const PLAYER_SPEED = 7;
const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;
const BULLET_SPEED = 10;
const INVADER_ROWS = 5;
const INVADER_COLS = 10;
const INVADER_WIDTH = 40;
const INVADER_HEIGHT = 40;
const INVADER_GAP = 15;
const INVADER_SPEED = 1;
const INVADER_FIRE_RATE = 0.001;

// Game state
let player: { x: number; y: number; width: number; height: number };
let bullets: { x: number; y: number; width: number; height: number; }[];
let invaders: { x: number; y: number; width: number; height: number; alive: boolean }[][];
let invaderBullets: { x: number; y: number; width: number; height: number; }[];
let invaderDirection: number;
let score: number;
let gameOver: boolean;
let keys: { [key: string]: boolean } = {};
let canShoot: boolean;
let invadersLeft: number;

function init() {
  player = {
    x: (CANVAS_WIDTH - PLAYER_WIDTH) / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };

  bullets = [];
  invaderBullets = [];
  invaders = [];
  invaderDirection = 1;
  score = 0;
  gameOver = false;
  canShoot = true;
  invadersLeft = INVADER_ROWS * INVADER_COLS;
  messageContainer.style.display = 'none';

  const startX = (CANVAS_WIDTH - (INVADER_COLS * (INVADER_WIDTH + INVADER_GAP) - INVADER_GAP)) / 2;
  const startY = 50;

  for (let r = 0; r < INVADER_ROWS; r++) {
    invaders[r] = [];
    for (let c = 0; c < INVADER_COLS; c++) {
      invaders[r][c] = {
        x: startX + c * (INVADER_WIDTH + INVADER_GAP),
        y: startY + r * (INVADER_HEIGHT + INVADER_GAP),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
        alive: true,
      };
    }
  }
  
  if (!animationFrameId) {
    gameLoop();
  }
}

// Input handling
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (gameOver && e.code === 'Enter') {
    init();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'Space') {
    canShoot = true;
  }
});

function update() {
  if (gameOver) return;

  // Player movement
  if (keys['ArrowLeft'] && player.x > 0) {
    player.x -= PLAYER_SPEED;
  }
  if (keys['ArrowRight'] && player.x < CANVAS_WIDTH - player.width) {
    player.x += PLAYER_SPEED;
  }

  // Player shooting
  if (keys['Space'] && canShoot) {
    bullets.push({
      x: player.x + player.width / 2 - BULLET_WIDTH / 2,
      y: player.y,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
    });
    canShoot = false; // Prevent holding space to fire
  }

  // Update bullets
  bullets.forEach((bullet, index) => {
    bullet.y -= BULLET_SPEED;
    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });
  
  // Update invader bullets
  invaderBullets.forEach((bullet, index) => {
    bullet.y += BULLET_SPEED / 2;
    if (bullet.y > CANVAS_HEIGHT) {
      invaderBullets.splice(index, 1);
    }
    // Check collision with player
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
        endGame(false);
    }
  });

  // Update invaders
  let shiftDown = false;
  for (const row of invaders) {
    for (const invader of row) {
      if (invader.alive) {
        invader.x += INVADER_SPEED * invaderDirection;
        if (invader.x <= 0 || invader.x >= CANVAS_WIDTH - invader.width) {
          shiftDown = true;
        }
        
        // Invader firing
        if(Math.random() < INVADER_FIRE_RATE) {
            invaderBullets.push({
                x: invader.x + invader.width / 2 - BULLET_WIDTH / 2,
                y: invader.y + invader.height,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
            });
        }

        // Game over if invaders reach player
        if (invader.y + invader.height >= player.y) {
            endGame(false);
        }
      }
    }
  }

  if (shiftDown) {
    invaderDirection *= -1;
    for (const row of invaders) {
      for (const invader of row) {
        invader.y += INVADER_HEIGHT;
      }
    }
  }

  // Collision detection: bullets and invaders
  bullets.forEach((bullet, bIndex) => {
    invaders.forEach((row) => {
      row.forEach((invader) => {
        if (
          invader.alive &&
          bullet.x < invader.x + invader.width &&
          bullet.x + bullet.width > invader.x &&
          bullet.y < invader.y + invader.height &&
          bullet.y + bullet.height > invader.y
        ) {
          invader.alive = false;
          bullets.splice(bIndex, 1);
          score += 10;
          invadersLeft--;
          if(invadersLeft === 0) {
            endGame(true);
          }
        }
      });
    });
  });
}

function draw() {
  // Clear canvas with a fade effect to create trails
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw player
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  // The rocket emoji is angled at 45 degrees, so we rotate by -45 degrees to make it point up.
  ctx.rotate(-Math.PI / 4);
  ctx.font = '36px sans-serif'; // Approx size for 40x40 box
  ctx.fillText(PLAYER_SKIN, 0, 0);
  ctx.restore();

  // Draw bullets
  ctx.font = '20px sans-serif';
  bullets.forEach((bullet) => {
    ctx.fillText(BULLET_SKIN, bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
  });
  
  // Draw invader bullets
  ctx.font = '20px sans-serif';
  invaderBullets.forEach((bullet) => {
    ctx.fillText(INVADER_BULLET_SKIN, bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
  });

  // Draw invaders
  ctx.font = '32px sans-serif'; // Approx size for 40x40 box
  invaders.forEach((row) => {
    row.forEach((invader) => {
      if (invader.alive) {
        ctx.fillText(INVADER_SKIN, invader.x + invader.width / 2, invader.y + invader.height / 2);
      }
    });
  });
  
  // Draw score
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = '20px "Courier New"';
  ctx.fillText(`Score: ${score}`, 10, 25);
}

function endGame(win: boolean) {
    gameOver = true;
    messageContainer.style.display = 'flex';
    if(win) {
        messageEl.textContent = 'YOU WIN!';
        messageEl.style.color = '#0f0';
        subMessageEl.textContent = `Final Score: ${score}`;
    } else {
        messageEl.textContent = 'GAME OVER';
        messageEl.style.color = '#f00';
        subMessageEl.textContent = 'Press Enter to Restart';
    }
}


let animationFrameId: number;
function gameLoop() {
  update();
  draw();
  animationFrameId = requestAnimationFrame(gameLoop);
}

init();
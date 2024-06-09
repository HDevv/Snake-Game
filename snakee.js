var canvas = document.getElementById("snakeGame");
canvas.width = 600;
canvas.height = 600;
var ctx = canvas.getContext("2d");
var size = 20;
var tileSize = canvas.width / size;
var snakes;
var fruit;
var score = 0;
var isGameOver = false;
var scores = JSON.parse(localStorage.getItem("snakeScores")) || [];
var bgImage = new Image();
bgImage.src = "/assets/snakeimg.jpg";

// Entrées clavier
function handleKeyDown(e) {
  switch (e.keyCode) {
    case 37:
      e.preventDefault();
      snake.changeDirection(-1, 0);
      break;
    case 38:
      e.preventDefault();
      snake.changeDirection(0, -1);
      break;
    case 39:
      e.preventDefault();
      snake.changeDirection(1, 0);
      break;
    case 40:
      e.preventDefault();
      snake.changeDirection(0, 1);
      break;
  }
}

// Initialise fruit
function initFruit() {
  fruit = {
    x: Math.floor(Math.random() * size),
    y: Math.floor(Math.random() * size),
  };
}

// Initialise serpent
function initSnake(
  isPlayer = false,
  startX = Math.floor(Math.random() * size),
  startY = Math.floor(Math.random() * size)
) {
  return {
    body: [{ x: startX, y: startY }],
    direction: { x: 0, y: isPlayer ? -1 : 1 },
    grow: 0,
    isPlayer: isPlayer,
    move: function () {
      let head = { ...this.body[0] };
      head.x += this.direction.x;
      head.y += this.direction.y;
      head.x = (head.x + size) % size;
      head.y = (head.y + size) % size;
      if (this.grow > 0) {
        this.body.unshift(head);
        this.grow--;
      } else {
        this.body.unshift(head);
        this.body.pop();
      }
    },
    changeDirection: function (x, y) {
      if (-x !== this.direction.x && -y !== this.direction.y) {
        this.direction = { x, y };
      }
    },
    eats: function (fruit) {
      const head = this.body[0];
      if (head.x === fruit.x && head.y === fruit.y) {
        this.grow++;
        if (this.isPlayer) {
          updateScore(10);
        }
        return true;
      }
      return false;
    },
    checkCollision: function () {
      const head = this.body[0];
      for (let i = 1; i < this.body.length; i++) {
        if (head.x === this.body[i].x && head.y === this.body[i].y) {
          return true;
        }
      }
      return false;
    },
    eatsOtherSnake: function (otherSnake) {
      const head = this.body[0];
      return otherSnake.body.some(
        (part) => head.x === part.x && head.y === part.y
      );
    },
  };
}

// Initialise les serpents IA
function initAISnakes(number) {
  snakes = [];
  for (let i = 0; i < number; i++) {
    snakes.push(initSnake(false));
  }
  snake = initSnake(true, 10, 10);
  snakes.push(snake);
}

// Mouvement des serpents IA
function moveAI() {
  snakes.forEach((s) => {
    if (!s.isPlayer) {
      let directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];
      directions = directions.filter(
        (d) => !(d.x === -s.direction.x && d.y === -s.direction.y)
      );
      s.direction = directions[Math.floor(Math.random() * directions.length)];
    }
  });
}

// Mise à jour de l'état du jeu
function update() {
  snakes.forEach((snake) => snake.move());
  snakes.forEach((snake) => {
    if (snake.eats(fruit)) {
      initFruit();
    }
  });

  // joueur mange les autres serpents
  for (let i = 0; i < snakes.length; i++) {
    if (!snakes[i].isPlayer && snake.eatsOtherSnake(snakes[i])) {
      snake.grow += snakes[i].body.length;
      updateScore(snakes[i].body.length * 5);
      snakes.splice(i, 1);
      i--;
    }
  }

  if (snake.checkCollision()) {
    isGameOver = true;
  }
}

// Dessine la langue du serpent
function drawTongue(snake) {
  const head = snake.body[0];
  ctx.fillStyle = "red";
  ctx.fillRect(
    head.x * tileSize + tileSize / 4,
    head.y * tileSize + tileSize / 4,
    tileSize / 2,
    tileSize / 2
  );
}

// Dessine la pomme
function drawApple(x, y) {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(
    x * tileSize + tileSize / 2,
    y * tileSize + tileSize / 2,
    tileSize / 2,
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.fillStyle = "brown";
  ctx.fillRect(x * tileSize + tileSize / 2, y * tileSize, 2, 5);
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(x * tileSize + tileSize / 2 + 2, y * tileSize, 2, 0, Math.PI);
  ctx.fill();
}

// Dessine un serpent
function drawSnake(s) {
  s.body.forEach((part) => {
    ctx.fillStyle = s.isPlayer ? "lime" : "#AF47D2";
    ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
  });
}

// Dessine le jeu
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.2;
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height); // Dessine l'image de fond avec transparence
  ctx.globalAlpha = 1.0;
  drawApple(fruit.x, fruit.y);
  snakes.forEach((snake) => {
    drawSnake(snake);
    drawTongue(snake);
  });
  document.getElementById("scoreBoard").textContent = `Score: ${score}`;
}

// Boucle principale du jeu
function gameLoop() {
  if (!isGameOver) {
    moveAI();
    update();
    draw();
    setTimeout(gameLoop, 100);
  } else {
    checkHighScore();
    displayScores(); // Afficher scores après fin de partie
  }
}

// Vérifie et gère les scores élevés
function checkHighScore() {
  const lowestScore = scores.length > 0 ? scores[scores.length - 1].score : 0;
  if (score > lowestScore || scores.length < 20) {
    const name = prompt("Bravo champion 🥳 Entre ton nom (6-20 caractères):");
    if (name && name.length >= 6 && name.length <= 20) {
      scores.push({ score: score, name: name });
      scores.sort((a, b) => b.score - a.score);
      if (scores.length > 20) {
        scores.pop();
      }
      localStorage.setItem("snakeScores", JSON.stringify(scores));
    }
  }
  displayScores();
}

// Affiche les scores
function displayScores() {
  const list = document.getElementById("topScoresList");
  list.innerHTML = "";
  scores.forEach(function (entry) {
    const item = document.createElement("li");
    item.textContent = `${entry.name}: ${entry.score}`;
    list.appendChild(item);
  });
}

// Mise à jour du score
function updateScore(points) {
  score += points;
}

// Initialise le jeu
function initGame() {
  document.addEventListener("keydown", handleKeyDown);
  initAISnakes(3); // 3 serpents IA
  initFruit();
  gameLoop();
}

bgImage.onload = function () {
  initGame();
};

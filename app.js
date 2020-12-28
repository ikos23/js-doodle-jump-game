const boardHeight = 600;
const boardWidth = 400;

const doodleInitialPosLeft = 150;
const doodleInitialPosBottom = 50;
const doodleWidth = 65;
const doodleHeight = 65;

const platformsCount = 5;
const platformWidth = 60;
const platformHeight = 15;

function Game() {
  const board = document.querySelector(".board");
  board.style.height = `${boardHeight}px`;
  board.style.width = `${boardWidth}px`;

  this.isGameOver = false;
  this.platforms = [];
  this.platformsSpeed = 3;
  this.doodle = null;
  this.movePlatformsId = null;
  this.doodleIsJumping = false;
  this.doodleIsFalling = false;
  this.score = 0;

  // create Doodle and put on the first platform
  const initDoodle = () => {
    if (!this.platforms[0]) {
      throw new Error("Platforms must be initialized first.");
    }
    const doodle = new Doodle(
      this.platforms[0].getLeft(),
      this.platforms[0].getBottom() + platformHeight
    );
    this.doodle = doodle;
    this.doodle.drawOnBoard(board);
  };

  const addPlatform = (posBottom) => {
    const posLeft = Math.random() * (boardWidth - platformWidth);
    const platform = new Platform(posLeft, posBottom);
    platform.drawOnBoard(board);
    this.platforms.push(platform);
  };

  const initPlatforms = () => {
    for (let i = 0; i < platformsCount; i++) {
      const platformArea = boardHeight / platformsCount;
      const platfBottom = 100 + i * platformArea;
      addPlatform(platfBottom);
    }
  };

  const gameOver = () => {
    this.isGameOver = true;
    this.doodle.destroy();
    clearInterval(this.movePlatformsId);
    const h2 = document.createElement("h2");
    const text = document.createTextNode("GAME OVER");
    h2.appendChild(text);
    h2.classList.add("gameOver");
    board.appendChild(h2);
  };

  // "listens" to what is happening and in case of game over
  // stops everything :)
  const checkForGameOver = () => {
    const gameOverCheck = setInterval(() => {
      // game is over when Doodle reaches the bottom of the board
      if (this.doodle.getBottom() < 0) {
        gameOver();
        clearInterval(gameOverCheck);
      }
    }, 10);
  };

  const movePlatforms = () => {
    this.movePlatformsId = setInterval(() => {
      // if the most bottom one reaches the edge of the board
      if (this.platforms[0].getBottom() < 0) {
        // remove it
        const toBeRemoved = this.platforms.shift();
        toBeRemoved.destroy();
        // add new one on top
        const newPlatBottom = boardHeight - platformHeight;
        addPlatform(newPlatBottom);
      } else {
        // otherwise we just move all of them down
        this.platforms.forEach((plt) => {
          plt.moveDown(this.platformsSpeed);
        });

        // we also move Doodle if it is on some platform
        if (!this.doodleIsFalling && !this.doodleIsJumping) {
          this.doodle.moveDown(this.platformsSpeed);
        }
      }
    }, 100);
  };

  const doodleJump = () => {
    if (!this.doodleIsJumping && !this.doodleIsFalling) {
      this.doodleIsJumping = true;

      const jumpStartPos = this.doodle.getBottom();
      const jumpId = setInterval(() => {
        if (this.doodle.getBottom() - jumpStartPos < 200) {
          this.doodle.moveUp();
        } else {
          this.doodleIsJumping = false;
          this.doodleIsFalling = true;
          clearInterval(jumpId);
          doodleFall();
        }
      }, 25);
    }
  };

  const doodleFall = () => {
    const fallId = setInterval(() => {
      if (this.doodleIsFalling) {
        // Doodle falls until reach some platform or until game over
        const doodleHere = getPlatformDoodleIsOn();
        if (doodleHere != null) {
          clearInterval(fallId);
          this.doodleIsFalling = false;
          this.doodle.align(doodleHere.getBottom() + platformHeight);

          // and update score :)
          this.score += 1;
          document.querySelector("#score").innerHTML = `score ${this.score}`;
        } else {
          this.doodle.moveDown(2 * this.platformsSpeed);
        }
      }
    }, 20);
  };

  const doodleLeft = () => {
    if (this.doodle.getLeft() > 5) {
      this.doodle.moveLeft();
      if (!this.doodleIsFalling && !this.doodleIsJumping && getPlatformDoodleIsOn() === null){
        // oops, outside the platform
        this.doodleIsFalling = true;
        doodleFall();
      }
    }
  };

  const doodleRight = () => {
    if (this.doodle.getLeft() + doodleWidth < boardWidth - 5) {
      this.doodle.moveRight();
      if (!this.doodleIsFalling && !this.doodleIsJumping && getPlatformDoodleIsOn() === null){
        // oops, outside the platform
        this.doodleIsFalling = true;
        doodleFall();
      }
    }
  };

  const getPlatformDoodleIsOn = () => {
    const doodleBottom = this.doodle.getBottom();
    const doodleLeft = this.doodle.getLeft();

    for (let i = 0; i < this.platforms.length; i++) {
      const platformBottom = this.platforms[i].getBottom();
      const platformLeft = this.platforms[i].getLeft();

      const diff =
        Math.round(doodleBottom) - Math.round(platformBottom + platformHeight);
      if (diff >= 0 && diff <= 5) {
        // this platform is on the same level as Doodle's legs
        // but this does not mean Doodle is on it (e.g. can be far away to the right)
        // we need to check it
        if (
          doodleLeft + doodleWidth * 0.65 >= platformLeft &&
          doodleLeft <= platformLeft + platformWidth * 0.9
        ) {
          return this.platforms[i];
        }
      }
    }

    return null;
  };

  const registerEventHandlers = () => {
    const Key = {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
    };

    document.addEventListener("keydown", (e) => {
      const keyCode = e.keyCode || e.which;
      switch (keyCode) {
        case Key.LEFT:
          doodleLeft();
          break;
        case Key.RIGHT:
          doodleRight();
          break;
        case Key.UP:
          doodleJump();
          break;
        default:
          break;
      }
    });
  };

  const start = () => {
    initPlatforms();
    initDoodle();
    registerEventHandlers();
    checkForGameOver();
    movePlatforms();
  };

  return { start };
}

function Doodle(initialPosLeft, initialPosBottom) {
  if (!initialPosLeft || !initialPosBottom) {
    throw new Error(
      "Doodle cannot be created with no initial left/bottom coords specified."
    );
  }

  // initial position
  this.positionLeft = initialPosLeft;
  this.positionBottom = initialPosBottom;

  // visualization
  this.htmlElement = document.createElement("div");
  this.htmlElement.classList.add("doodle");
  this.htmlElement.style.width = `${doodleWidth}px`;
  this.htmlElement.style.height = `${doodleHeight}px`;
  this.htmlElement.style.left = `${this.positionLeft}px`;
  this.htmlElement.style.bottom = `${this.positionBottom}px`;

  const drawOnBoard = (board) => board.appendChild(this.htmlElement);

  // actions
  const moveLeft = () => {
    this.positionLeft -= 15;
    this.htmlElement.style.left = `${this.positionLeft}px`;
  };

  const moveRight = () => {
    this.positionLeft += 15;
    this.htmlElement.style.left = `${this.positionLeft}px`;
  };

  const moveUp = () => {
    this.positionBottom += 7;
    this.htmlElement.style.bottom = `${this.positionBottom}px`;
  };

  const moveDown = (speed) => {
    this.positionBottom -= speed;
    this.htmlElement.style.bottom = `${this.positionBottom}px`;
  };

  const getBottom = () => this.positionBottom;

  const align = (newBottom) => {
    this.positionBottom = newBottom;
    this.htmlElement.style.bottom = `${this.positionBottom}px`;
  };

  const getLeft = () => this.positionLeft;

  const destroy = () => {
    this.htmlElement.remove();
  };

  return {
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    getBottom,
    getLeft,
    drawOnBoard,
    destroy,
    align,
  };
}

function Platform(initialPosLeft, initialPosBottom) {
  if (!initialPosLeft || !initialPosBottom) {
    throw new Error(
      "Platform cannot be created with no initial left/bottom coords specified."
    );
  }

  // initial position
  this.positionLeft = initialPosLeft;
  this.positionBottom = initialPosBottom;

  // visualization
  this.htmlElement = document.createElement("div");
  this.htmlElement.classList.add("platform");
  this.htmlElement.style.width = `${platformWidth}px`;
  this.htmlElement.style.height = `${platformHeight}px`;
  this.htmlElement.style.left = `${this.positionLeft}px`;
  this.htmlElement.style.bottom = `${this.positionBottom}px`;

  const drawOnBoard = (board) => board.appendChild(this.htmlElement);

  const moveDown = (speed) => {
    this.positionBottom -= speed;
    this.htmlElement.style.bottom = `${this.positionBottom}px`;
  };

  const getBottom = () => this.positionBottom;

  const getLeft = () => this.positionLeft;

  const destroy = () => {
    this.htmlElement.remove();
  };

  return {
    drawOnBoard,
    moveDown,
    getLeft,
    getBottom,
    destroy,
  };
}

const game = new Game();
document.querySelector("#startBtn").addEventListener('click', () => {
  document.querySelector("#startBtn").remove();
  game.start();
});

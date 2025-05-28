// Select all necessary DOM elements
const playerNameInput = document.getElementById('playerName');
const saveNameBtn = document.getElementById('saveName');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const status = document.getElementById('status');
const startGameBtn = document.getElementById('startGame');
const playerScoreDisplay = document.getElementById('playerScore');
const aiScoreDisplay = document.getElementById('aiScore');
const highScoreDisplay = document.getElementById('highScore');
const gameBoard = document.getElementById('gameBoard');

// Load saved data from localStorage
let playerName = localStorage.getItem('playerName') || 'Player';
let playerScore = parseInt(localStorage.getItem('playerScore')) || 0;
let aiScore = parseInt(localStorage.getItem('aiScore')) || 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;

playerNameDisplay.textContent = `${playerName}: `; // Update display with saved name
playerScoreDisplay.textContent = playerScore;
aiScoreDisplay.textContent = aiScore;
highScoreDisplay.textContent = highScore;

// Initialize the game board with 9 cells
function createBoard() {
  gameBoard.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.addEventListener('click', handleCellClick, { once: true });
    gameBoard.appendChild(cell);
  }
}

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = false;

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

function startGame() {
  if (!playerName || playerName === 'Player') {
    status.textContent = 'Please enter and save your name first!';
    return;
  }
  board = ['', '', '', '', '', '', '', '', ''];
  gameActive = true;
  currentPlayer = 'X';
  status.textContent = `${playerName}'s turn (X)`;
  createBoard();
}

function handleCellClick(e) {
  const cell = e.target;
  const index = Array.from(gameBoard.children).indexOf(cell);

  if (board[index] !== '' || !gameActive) return;

  placeMark(cell, index);
  if (checkWin()) {
    endGame(false);
    return;
  }
  if (checkDraw()) {
    endGame(true);
    return;
  }

  currentPlayer = 'O';
  status.textContent = 'AI\'s turn (O)';
  setTimeout(aiMove, 500);
}

function placeMark(cell, index) {
  board[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());
}

function aiMove() {
  const bestMove = minimax(board, 'O').index;
  placeMark(gameBoard.children[bestMove], bestMove);
  if (checkWin()) {
    endGame(false);
    return;
  }
  if (checkDraw()) {
    endGame(true);
    return;
  }
  currentPlayer = 'X';
  status.textContent = `${playerName}'s turn (X)`;
}

function minimax(board, player) {
  const availableSpots = board.map((spot, index) => spot === '' ? index : null).filter(x => x !== null);

  if (checkWinForPlayer(board, 'X')) return { score: -10 };
  if (checkWinForPlayer(board, 'O')) return { score: 10 };
  if (availableSpots.length === 0) return { score: 0 };

  let moves = [];

  for (let i = 0; i < availableSpots.length; i++) {
    let move = {};
    move.index = availableSpots[i];
    board[availableSpots[i]] = player;

    if (player === 'O') {
      let result = minimax(board, 'X');
      move.score = result.score;
    } else {
      let result = minimax(board, 'O');
      move.score = result.score;
    }

    board[availableSpots[i]] = '';
    moves.push(move);
  }

  let bestMove;
  if (player === 'O') {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

function checkWinForPlayer(board, player) {
  return winningCombinations.some(combination => {
    return combination.every(index => board[index] === player);
  });
}

function checkWin() {
  return checkWinForPlayer(board, currentPlayer);
}

function checkDraw() {
  return board.every(cell => cell !== '');
}

function endGame(draw) {
  gameActive = false;
  if (draw) {
    status.textContent = 'Draw!';
  } else {
    status.textContent = `${currentPlayer === 'X' ? playerName : 'AI'} wins!`;
    if (currentPlayer === 'X') playerScore++;
    else aiScore++;
    if (playerScore + aiScore > highScore) highScore = playerScore + aiScore;
  }
  playerScoreDisplay.textContent = playerScore;
  aiScoreDisplay.textContent = aiScore;
  highScoreDisplay.textContent = highScore;

  // Save scores to localStorage
  localStorage.setItem('playerScore', playerScore);
  localStorage.setItem('aiScore', aiScore);
  localStorage.setItem('highScore', highScore);

  gameBoard.childNodes.forEach(cell => cell.removeEventListener('click', handleCellClick));
}

// Save player name and update display
saveNameBtn.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  if (name) {
    playerName = name;
    playerNameDisplay.textContent = `${playerName}: `;
    localStorage.setItem('playerName', playerName);
    status.textContent = `${playerName}'s turn (X)`;
    playerNameInput.value = ''; // Clear input
  } else {
    status.textContent = 'Please enter a valid name!';
  }
});

startGameBtn.addEventListener('click', startGame);
createBoard();
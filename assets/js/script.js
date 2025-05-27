let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = false;
let scores = { X: 0, O: 0 };
let playerNames = { X: 'Player X', O: 'Player O' };

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

function startGame() {
  const playerXInput = document.getElementById('playerX').value || 'Player X';
  const playerOInput = document.getElementById('playerO').value || 'Player O';
  playerNames = { X: playerXInput, O: playerOInput };
  resetGame();
}

function resetGame() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  document.getElementById('status').textContent = `${playerNames.X}'s turn`;
  renderBoard();
  updateScoreboard();
}

function renderBoard() {
  const gameBoard = document.getElementById('gameBoard');
  gameBoard.innerHTML = '';
  board.forEach((cell, index) => {
    const cellElement = document.createElement('div');
    cellElement.classList.add('cell');
    if (cell) cellElement.classList.add(cell.toLowerCase());
    cellElement.setAttribute('data-index', index);
    cellElement.addEventListener('click', handleCellClick);
    gameBoard.appendChild(cellElement);
  });
}

function handleCellClick(e) {
  const index = e.target.getAttribute('data-index');
  if (board[index] || !gameActive) return;

  board[index] = currentPlayer;
  renderBoard();

  if (checkWin()) {
    scores[currentPlayer]++;
    document.getElementById('status').textContent = `${playerNames[currentPlayer]} wins!`;
    gameActive = false;
    updateScoreboard();
    addRestartButton();
    return;
  }
  if (board.every(cell => cell)) {
    document.getElementById('status').textContent = "It's a draw!";
    gameActive = false;
    addRestartButton();
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  document.getElementById('status').textContent = `${playerNames[currentPlayer]}'s turn`;
}

function checkWin() {
  return winningCombinations.some(combination => {
    return combination.every(index => board[index] === currentPlayer);
  });
}

function updateScoreboard() {
  const scoreboard = document.getElementById('scoreboard');
  scoreboard.innerHTML = `
    <li>${playerNames.X}: ${scores.X}</li>
    <li>${playerNames.O}: ${scores.O}</li>
  `;
  let highScore = Math.max(scores.X, scores.O);
  document.getElementById('highScore').textContent = `High Score: ${highScore}`;
}

function addRestartButton() {
  const gameControls = document.querySelector('.game-controls');
  let restartButton = document.getElementById('restartButton');
  if (!restartButton) {
    restartButton = document.createElement('button');
    restartButton.id = 'restartButton';
    restartButton.textContent = 'Restart Game';
    restartButton.addEventListener('click', resetGame);
    gameControls.appendChild(restartButton);
  }
}

// Initialize game (disabled initial render to require Start Game click)
document.getElementById('status').textContent = 'Click "Start Game" to begin';
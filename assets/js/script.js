class TicTacToe {
  constructor() {
    // Cache DOM elements
    this.playerNameInput = document.getElementById('playerName');
    this.saveNameBtn = document.getElementById('saveName');
    this.playerNameDisplay = document.getElementById('playerNameDisplay');
    this.status = document.getElementById('status');
    this.startGameBtn = document.getElementById('startGame');
    this.resetGameBtn = document.getElementById('resetGame');
    this.playerScoreDisplay = document.getElementById('playerScore');
    this.aiScoreDisplay = document.getElementById('aiScore');
    this.highScoresList = document.getElementById('highScoresList');
    this.gameBoard = document.getElementById('gameBoard');
    this.nameError = document.getElementById('nameError');

    // Initialize game state
    this.playerName = localStorage.getItem('playerName') || 'Player';
    this.playerScore = 0;
    this.aiScore = 0;
    this.highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    this.board = ['', '', '', '', '', '', '', '', ''];
    this.currentPlayer = 'X';
    this.gameActive = false;

    this.winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    // Bind event listeners
    this.saveNameBtn.addEventListener('click', () => this.saveName());
    this.startGameBtn.addEventListener('click', () => this.startGame());
    this.resetGameBtn.addEventListener('click', () => this.resetGame());
    this.gameBoard.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Initialize display
    this.updateScoreboard();
    this.updateHighScores();
    this.createBoard();
  }

  // Create the game board with 9 cells
  createBoard() {
    this.gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('aria-label', `Cell ${i + 1}, empty`);
      cell.addEventListener('click', (e) => this.handleCellClick(e, i), { once: true });
      this.gameBoard.appendChild(cell);
    }
  }

  // Start a new game
  startGame() {
    if (!this.playerName || this.playerName === 'Player') {
      this.status.textContent = 'Please enter and save your name first!';
      this.nameError.textContent = 'Name cannot be empty!';
      this.playerNameInput.classList.add('shake');
      setTimeout(() => this.playerNameInput.classList.remove('shake'), 300);
      return;
    }
    console.log('Starting new game');
    this.board = ['', '', '', '', '', '', '', '', ''];
    this.gameActive = true;
    this.currentPlayer = 'X';
    this.status.textContent = `${this.playerName}'s turn (X) vs. AI (O)`;
    this.createBoard();
  }

  // Reset the game
  resetGame() {
    console.log('Resetting game');
    this.board = ['', '', '', '', '', '', '', '', ''];
    this.gameActive = false;
    this.currentPlayer = 'X';
    this.playerScore = 0;
    this.aiScore = 0;
    this.status.textContent = 'Game reset. Enter your name to start!';
    this.updateScoreboard();
    this.updateHighScores();
    this.createBoard();
  }

  // Handle cell click
  handleCellClick(e, index) {
    if (this.board[index] !== '' || !this.gameActive) return;

    this.placeMark(e.target, index);
    if (this.checkWin()) {
      this.endGame(false);
      return;
    }
    if (this.checkDraw()) {
      console.log('Draw detected');
      this.endGame(true);
      return;
    }

    this.currentPlayer = 'O';
    this.status.textContent = 'AI\'s turn (O)';
    setTimeout(() => this.aiMove(), Math.random() * 500 + 500);
  }

  // Handle keyboard navigation
  handleKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const index = Array.from(this.gameBoard.children).indexOf(e.target);
      if (this.board[index] === '' && this.gameActive) {
        this.handleCellClick(e, index);
      }
    }
  }

  // Place a mark on the board
  placeMark(cell, index) {
    this.board[index] = this.currentPlayer;
    cell.textContent = this.currentPlayer;
    cell.classList.add(this.currentPlayer.toLowerCase());
    cell.setAttribute('aria-label', `Cell ${index + 1}, ${this.currentPlayer}`);
  }

  // AI move using minimax
  aiMove() {
    const bestMove = this.minimax(this.board, 'O').index;
    this.placeMark(this.gameBoard.children[bestMove], bestMove);
    if (this.checkWin()) {
      this.endGame(false);
      return;
    }
    if (this.checkDraw()) {
      console.log('Draw detected in AI move');
      this.endGame(true);
      return;
    }
    this.currentPlayer = 'X';
    this.status.textContent = `${this.playerName}'s turn (X) vs. AI (O)`;
  }

  // Minimax algorithm to determine AI's best move
  minimax(board, player) {
    const availableSpots = board.map((spot, i) => spot === '' ? i : null).filter(x => x !== null);

    if (this.checkWinForPlayer(board, 'X')) return { score: -10 };
    if (this.checkWinForPlayer(board, 'O')) return { score: 10 };
    if (availableSpots.length === 0) return { score: 0 };

    let moves = [];
    for (let i = 0; i < availableSpots.length; i++) {
      let move = {};
      move.index = availableSpots[i];
      board[availableSpots[i]] = player;

      if (player === 'O') {
        move.score = this.minimax(board, 'X').score;
      } else {
        move.score = this.minimax(board, 'O').score;
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

  // Check if a player has won
  checkWinForPlayer(board, player) {
    return this.winningCombinations.some(combination => {
      return combination.every(index => board[index] === player);
    });
  }

  // Check for a win
  checkWin() {
    return this.checkWinForPlayer(this.board, this.currentPlayer);
  }

  // Check for a draw
  checkDraw() {
    return this.board.every(cell => cell !== '');
  }

  // End the game
  endGame(draw) {
    this.gameActive = false;
    if (draw) {
      console.log('Ending game with draw, restarting in 0.5s');
      this.status.textContent = 'It\'s a draw! New game in 0.5s...';
      setTimeout(() => {
        console.log('Triggering restart');
        this.startGame();
      }, 500);
    } else {
      if (this.currentPlayer === 'X') {
        this.playerScore++;
        this.status.textContent = `${this.playerName} (X) wins!`;
      } else {
        this.aiScore++;
        this.status.textContent = 'AI (O) wins!';
      }
    }
    this.updateHighScores();
    this.updateScoreboard();
    this.gameBoard.childNodes.forEach(cell => cell.removeEventListener('click', this.handleCellClick));
  }

  // Save player name
  saveName() {
    const name = this.playerNameInput.value.trim();
    if (name) {
      this.playerName = name;
      this.playerNameDisplay.textContent = `${this.playerName}`;
      localStorage.setItem('playerName', this.playerName);
      this.status.textContent = `${this.playerName}'s turn (X) vs. AI (O)`;
      this.playerNameInput.value = '';
      this.nameError.textContent = '';
    } else {
      this.nameError.textContent = 'Please enter a valid name!';
      this.playerNameInput.classList.add('shake');
      setTimeout(() => this.playerNameInput.classList.remove('shake'), 300);
    }
  }

  // Update scoreboard display
  updateScoreboard() {
    this.playerNameDisplay.textContent = `${this.playerName}`;
    this.playerScoreDisplay.textContent = this.playerScore;
    this.aiScoreDisplay.textContent = this.aiScore;
  }

  // Update high scores
  updateHighScores() {
    // Add or update the player's score
    const existingPlayerIndex = this.highScores.findIndex(player => player.name === this.playerName);
    if (existingPlayerIndex !== -1) {
      this.highScores[existingPlayerIndex].score = this.playerScore;
    } else {
      this.highScores.push({ name: this.playerName, score: this.playerScore });
    }

    // Sort high scores in descending order and take top 3
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 3);

    // Save to localStorage
    localStorage.setItem('highScores', JSON.stringify(this.highScores));

    // Update high scores display
    this.highScoresList.innerHTML = '';
    if (this.highScores.length === 0) {
      let li = document.createElement('li');
      li.textContent = 'No scores yet';
      this.highScoresList.appendChild(li);
    } else {
      this.highScores.forEach(({ name, score }) => {
        const li = document.createElement('li');
        li.textContent = `${name}: ${score}`;
        this.highScoresList.appendChild(li);
      });
    }
  }
}

// Initialize the game
const game = new TicTacToe();
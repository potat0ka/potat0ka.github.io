document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing Tic-Tac-Toe, timeline text centered');
  const timelineEvents = document.querySelectorAll('.event');
  console.log(`Timeline rendered with ${timelineEvents.length} events`);

  class TicTacToe {
    constructor() {
      console.log('TicTacToe constructor called');
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

      if (!this.gameBoard) {
        console.error('Error: #gameBoard not found in DOM');
        return;
      }

      this.playerName = localStorage.getItem('playerName') || 'Player';
      this.playerScore = 0;
      this.aiScore = 0;
      this.highScores = JSON.parse(localStorage.getItem('highScores')) || [];
      this.board = ['', '', '', '', '', '', '', '', ''];
      this.currentPlayer = 'X';
      this.gameActive = false;

      this.winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      this.bindEvents();
      this.updateScoreboard();
      this.updateHighScores();
      this.createBoard();
    }

    bindEvents() {
      if (this.saveNameBtn) {
        this.saveNameBtn.addEventListener('click', () => this.saveName());
        console.log('Save name button event bound');
      }
      if (this.startGameBtn) {
        this.startGameBtn.addEventListener('click', () => this.startGame());
        console.log('Start game button event bound');
      }
      if (this.resetGameBtn) {
        this.resetGameBtn.addEventListener('click', () => this.resetGame());
        console.log('Reset game button event bound');
      }
      if (this.gameBoard) {
        this.gameBoard.addEventListener('keydown', (e) => this.handleKeydown(e));
        console.log('Game board keydown event bound');
      }
    }

    createBoard() {
      console.log('Creating game board');
      if (!this.gameBoard) {
        console.error('Cannot create board: #gameBoard not found');
        return;
      }
      console.log('Game board: 240x240px, gradient background (#34495e to #2c3e50), 10px padding, scoreboard: 240px, cells: 70x70px with shadow, header: gradient name with pulse, photo: images/myphoto.jpg');
      this.gameBoard.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell-content');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', `Cell ${i + 1}, empty`);
        cell.dataset.index = i;
        cell.addEventListener('click', () => this.handleCellClick(i), { once: true });
        this.gameBoard.appendChild(cell);
      }
      console.log('Game board created with 9 cells, each 70x70px');
    }

    startGame() {
      if (!this.playerName || this.playerName === 'Player') {
        if (this.nameError) {
          this.nameError.textContent = 'Please enter a name!';
        }
        if (this.playerNameInput) {
          this.playerNameInput.classList.add('shake');
          setTimeout(() => this.playerNameInput.classList.remove('shake'), 300);
        }
        console.warn('Start game failed: No player name');
        return;
      }
      console.log('Starting game');
      this.board = ['', '', '', '', '', '', '', '', ''];
      this.gameActive = true;
      this.currentPlayer = 'X';
      if (this.status) {
        this.status.textContent = `${this.playerName}'s turn (X)`;
      }
      if (this.gameBoard) {
        this.gameBoard.classList.add('restart');
        setTimeout(() => this.gameBoard.classList.remove('restart'), 200);
      }
      this.createBoard();
    }

    resetGame() {
      console.log('Resetting game');
      this.board = ['', '', '', '', '', '', '', '', ''];
      this.gameActive = false;
      this.currentPlayer = 'X';
      this.playerScore = 0;
      this.aiScore = 0;
      if (this.status) {
        this.status.textContent = 'Enter your name to start';
      }
      this.updateScoreboard();
      this.createBoard();
    }

    handleCellClick(index) {
      if (!this.gameActive || this.board[index] !== '') {
        console.log(`Cell ${index} click ignored: gameActive=${this.gameActive}, board[${index}]=${this.board[index]}`);
        return;
      }
      console.log(`Player clicked cell ${index}`);
      this.board[index] = this.currentPlayer;
      const cell = this.gameBoard.children[index];
      cell.textContent = this.currentPlayer;
      cell.classList.add(this.currentPlayer.toLowerCase());
      cell.setAttribute('aria-label', `Cell ${index + 1}, ${this.currentPlayer}`);
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
      if (this.status) {
        this.status.textContent = 'AI\'s turn';
      }
      setTimeout(() => this.aiMove(), 500);
    }

    handleKeydown(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const index = e.target.dataset.index;
        if (index && this.board[index] === '' && this.gameActive) {
          console.log(`Keydown on cell ${index}`);
          this.handleCellClick(parseInt(index));
        }
      }
    }

    aiMove() {
      const bestMove = this.minimax(this.board, 'O').index;
      if (bestMove === undefined) {
        console.error('AI move failed: No valid move found');
        return;
      }
      console.log(`AI move: cell ${bestMove}`);
      this.board[bestMove] = 'O';
      const cell = this.gameBoard.children[bestMove];
      cell.textContent = 'O';
      cell.classList.add('o');
      cell.setAttribute('aria-label', `Cell ${bestMove + 1}, O`);
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
      if (this.status) {
        this.status.textContent = `${this.playerName}'s turn (X)`;
      }
    }

    minimax(board, player, depth = 0) {
      const available = board.map((val, i) => val === '' ? i : null).filter(val => val !== null);
      if (this.checkWinForPlayer(board, 'X')) return { score: -10 + depth };
      if (this.checkWinForPlayer(board, 'O')) return { score: 10 - depth };
      if (available.length === 0) return { score: 0 };

      const moves = [];
      for (const i of available) {
        const move = { index: i };
        board[i] = player;
        if (player === 'O') {
          move.score = this.minimax(board, 'X', depth + 1).score;
        } else {
          move.score = this.minimax(board, 'O', depth + 1).score;
        }
        board[i] = '';
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

    checkWinForPlayer(board, player) {
      return this.winningCombinations.some(combo => {
        return combo.every(index => board[index] === player);
      });
    }

    checkWin() {
      return this.checkWinForPlayer(this.board, this.currentPlayer);
    }

    checkDraw() {
      return this.board.every(cell => cell !== '');
    }

    endGame(draw) {
      this.gameActive = false;
      if (draw) {
        console.log('Game ended in draw, restarting in 0.5s');
        if (this.status) {
          this.status.textContent = 'Draw! New game in 0.5s...';
        }
        setTimeout(() => {
          console.log('Restarting game');
          this.startGame();
        }, 500);
      } else {
        if (this.currentPlayer === 'X') {
          this.playerScore++;
          if (this.status) {
            this.status.textContent = `${this.playerName} wins!`;
          }
        } else {
          this.aiScore++;
          if (this.status) {
            this.status.textContent = 'AI wins!';
          }
        }
      }
      this.updateScoreboard();
      this.updateHighScores();
    }

    saveName() {
      const name = this.playerNameInput ? this.playerNameInput.value.trim() : '';
      if (name) {
        this.playerName = name;
        localStorage.setItem('playerName', name);
        if (this.playerNameDisplay) {
          this.playerNameDisplay.textContent = name;
        }
        if (this.status) {
          this.status.textContent = 'Click start to play';
        }
        if (this.nameError) {
          this.nameError.textContent = '';
        }
        console.log(`Player name saved: ${name}`);
      } else {
        if (this.nameError) {
          this.nameError.textContent = 'Name cannot be empty!';
        }
        if (this.playerNameInput) {
          this.playerNameInput.classList.add('shake');
          setTimeout(() => this.playerNameInput.classList.remove('shake'), 300);
        }
        console.warn('Save name failed: Empty name');
      }
    }

    updateScoreboard() {
      if (this.playerNameDisplay) {
        this.playerNameDisplay.textContent = this.playerName;
      }
      if (this.playerScoreDisplay) {
        this.playerScoreDisplay.textContent = this.playerScore;
      }
      if (this.aiScoreDisplay) {
        this.aiScoreDisplay.textContent = this.aiScore;
      }
      console.log(`Scoreboard updated: ${this.playerName}=${this.playerScore}, AI=${this.aiScore}`);
    }

    updateHighScores() {
      if (!this.highScoresList) return;
      const scoreEntry = this.highScores.find(entry => entry.name === this.playerName);
      if (scoreEntry) {
        scoreEntry.score = this.playerScore;
      } else {
        this.highScores.push({ name: this.playerName, score: this.playerScore });
      }
      this.highScores.sort((a, b) => b.score - a.score).slice(0, 3);
      localStorage.setItem('highScores', JSON.stringify(this.highScores));
      this.highScoresList.innerHTML = this.highScores.length
        ? this.highScores.map(s => `<li>${s.name}: ${s.score}</li>`).join('')
        : '<li>No scores yet</li>';
      console.log('High scores updated');
    }
  }

  if (document.getElementById('gameBoard')) {
    console.log('Found #gameBoard, initializing game');
    new TicTacToe();
  } else {
    console.error('Error: #gameBoard not found, cannot initialize game');
  }
});

/**
 * ================================
 * BIGENDRA SHRESTHA'S PORTFOLIO
 * Main JavaScript Module
 * ================================
 * 
 * This module handles all interactive functionality for the portfolio website.
 * 
 * Features include:
 * - Tic-Tac-Toe game with AI opponent using minimax algorithm
 * - Timeline animations with Intersection Observer API
 * - Local storage for high scores and game state persistence
 * - Comprehensive accessibility features and keyboard navigation
 * - Responsive design interactions and smooth scrolling
 * - Error handling and performance optimizations
 * 
 * Dependencies: None (vanilla JavaScript)
 * Browser Support: Modern browsers with ES6+ support
 * 
 * Author: Bigendra Shrestha
 * Version: 3.0
 * Last Updated: 2025
 */

'use strict';

// ================================
// UTILITY FUNCTIONS MODULE
// ================================

/**
 * Utility functions for common DOM operations and data manipulation
 */
const Utils = {
  /**
   * Safely query a single DOM element with error handling
   * @param {string} selector - CSS selector string
   * @returns {Element|null} - Found element or null if not found/error
   */
  querySelector: (selector) => {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.error(`Error selecting element with selector "${selector}":`, error);
      return null;
    }
  },

  /**
   * Safely query multiple DOM elements with error handling
   * @param {string} selector - CSS selector string
   * @returns {NodeList} - Found elements or empty NodeList if error
   */
  querySelectorAll: (selector) => {
    try {
      return document.querySelectorAll(selector);
    } catch (error) {
      console.error(`Error selecting elements with selector "${selector}":`, error);
      return [];
    }
  },

  /**
   * Sanitize user input to prevent XSS attacks
   * @param {string} input - Raw user input string
   * @returns {string} - Sanitized string safe for innerHTML
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  /**
   * Format date for consistent display across the application
   * @param {Date} date - Date object to format
   * @returns {string} - Formatted date string
   */
  formatDate: (date) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toString();
    }
  },

  /**
   * Debounce function to limit rapid function calls (performance optimization)
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function to limit function execution frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Check if device supports touch interactions
   * @returns {boolean} - True if touch device
   */
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Generate unique ID for elements
   * @returns {string} - Unique ID string
   */
  generateId: () => {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// ================================
// GAME CONSTANTS AND CONFIGURATION
// ================================

/**
 * Configuration object for game settings and constants
 */
const GAME_CONFIG = {
  // Board configuration
  BOARD_SIZE: 9,
  GRID_SIZE: 3,
  
  // Player symbols
  HUMAN_PLAYER: 'X',
  AI_PLAYER: 'O',
  
  // Winning combinations (indices on 3x3 grid)
  WINNING_COMBINATIONS: [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ],
  
  // Game states
  GAME_STATES: {
    WAITING: 'waiting',
    PLAYING: 'playing',
    ENDED: 'ended'
  },
  
  // AI difficulty settings
  AI_DELAY: 500, // Milliseconds to delay AI move for better UX
  DIFFICULTY_LEVELS: {
    BEGINNER: {
      name: 'Beginner',
      randomMoveChance: 0.7, // 70% chance of random move
      description: 'AI makes many mistakes'
    },
    AMATEUR: {
      name: 'Amateur', 
      randomMoveChance: 0.3, // 30% chance of random move
      description: 'AI sometimes makes mistakes'
    },
    PRO: {
      name: 'Pro',
      randomMoveChance: 0, // Always uses minimax
      description: 'AI never makes mistakes'
    }
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    HIGH_SCORES: 'ticTacToeHighScores',
    PLAYER_NAME: 'lastPlayerName',
    GAME_STATS: 'gameStatistics',
    DIFFICULTY: 'aiDifficulty'
  },
  
  // Validation rules
  VALIDATION: {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 20,
    MAX_HIGH_SCORES: 5
  }
};

// ================================
// TIC-TAC-TOE GAME CLASS
// ================================

/**
 * Complete Tic-Tac-Toe game implementation with AI opponent
 * 
 * Features:
 * - Minimax algorithm for unbeatable AI
 * - Score tracking and persistence
 * - Comprehensive accessibility support
 * - Keyboard navigation
 * - Error handling and validation
 */
class TicTacToe {
  /**
   * Initialize the Tic-Tac-Toe game
   */
  constructor() {
    // Game state properties
    this.board = new Array(GAME_CONFIG.BOARD_SIZE).fill('');
    this.currentPlayer = GAME_CONFIG.HUMAN_PLAYER;
    this.gameState = GAME_CONFIG.GAME_STATES.WAITING;
    this.playerName = '';
    this.scores = { player: 0, ai: 0 };
    this.gameStats = this.loadGameStats();
    this.highScores = this.loadHighScores();
    this.difficulty = this.loadDifficulty();
    
    // DOM element references (cached for performance)
    this.elements = this.cacheElements();
    
    // AI move timeout reference for cleanup
    this.aiMoveTimeout = null;
    
    // Initialize the game
    this.init();
  }

  /**
   * Cache all required DOM elements for performance
   * @returns {Object} - Object containing all cached DOM elements
   */
  cacheElements() {
    const elements = {
      gameBoard: Utils.querySelector('#gameBoard'),
      playerNameInput: Utils.querySelector('#playerName'),
      playerNameDisplay: Utils.querySelector('#playerNameDisplay'),
      saveNameButton: Utils.querySelector('#saveName'),
      startGameButton: Utils.querySelector('#startGame'),
      resetGameButton: Utils.querySelector('#resetGame'),
      statusDisplay: Utils.querySelector('#status'),
      playerScore: Utils.querySelector('#playerScore'),
      aiScore: Utils.querySelector('#aiScore'),
      highScoresList: Utils.querySelector('#highScoresList'),
      nameError: Utils.querySelector('#nameError'),
      difficultySelect: Utils.querySelector('#difficultySelect')
    };

    // Check for missing critical elements
    const criticalElements = ['gameBoard', 'statusDisplay'];
    const missingElements = criticalElements.filter(key => !elements[key]);
    
    if (missingElements.length > 0) {
      console.error('Critical game elements missing:', missingElements);
    }

    return elements;
  }

  /**
   * Initialize the game components and event listeners
   */
  init() {
    try {
      this.bindEvents();
      this.createGameBoard();
      this.updateScoreboard();
      this.updateHighScores();
      this.loadLastPlayerName();
      this.setupDifficultySelector();
      this.updateStatus('Enter your name to start playing');
      
      console.log('TicTacToe game initialized successfully');
    } catch (error) {
      console.error('Error initializing TicTacToe game:', error);
      this.handleError('Failed to initialize game. Please refresh the page.');
    }
  }

  /**
   * Bind all event listeners for game interaction
   */
  bindEvents() {
    // Player name input events
    if (this.elements.saveNameButton) {
      this.elements.saveNameButton.addEventListener('click', () => this.saveName());
    }

    if (this.elements.playerNameInput) {
      // Enter key support for name input
      this.elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveName();
        }
      });

      // Real-time validation feedback
      this.elements.playerNameInput.addEventListener('input', 
        Utils.debounce(() => this.validateNameInput(), 300)
      );
    }

    // Game control button events
    if (this.elements.startGameButton) {
      this.elements.startGameButton.addEventListener('click', () => this.startGame());
    }

    if (this.elements.resetGameButton) {
      this.elements.resetGameButton.addEventListener('click', () => this.resetGame());
    }

    // Keyboard navigation for game board
    if (this.elements.gameBoard) {
      this.elements.gameBoard.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
      this.elements.gameBoard.addEventListener('focusin', (e) => this.handleBoardFocus(e));
    }

    // Difficulty selector events
    if (this.elements.difficultySelect) {
      this.elements.difficultySelect.addEventListener('change', (e) => this.changeDifficulty(e.target.value));
    }

    // Window events for cleanup
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Create the interactive game board DOM structure
   */
  createGameBoard() {
    if (!this.elements.gameBoard) {
      console.error('Game board element not found');
      return;
    }

    // Clear existing board
    this.elements.gameBoard.innerHTML = '';
    
    // Create 9 cells for 3x3 grid
    for (let i = 0; i < GAME_CONFIG.BOARD_SIZE; i++) {
      const cell = this.createCell(i);
      this.elements.gameBoard.appendChild(cell);
    }

    console.log(`Game board created with ${GAME_CONFIG.BOARD_SIZE} cells`);
  }

  /**
   * Create a single game board cell
   * @param {number} index - Cell index (0-8)
   * @returns {HTMLElement} - Created cell element
   */
  createCell(index) {
    const cell = document.createElement('div');
    cell.className = 'cell-content';
    cell.setAttribute('data-index', index);
    cell.setAttribute('tabindex', this.gameState === GAME_CONFIG.GAME_STATES.PLAYING ? '0' : '-1');
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Cell ${index + 1}, empty`);
    
    // Click event for cell selection
    cell.addEventListener('click', () => this.handleCellClick(index));
    
    // Keyboard event for accessibility
    cell.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleCellClick(index);
      }
    });

    return cell;
  }

  /**
   * Validate player name input in real-time
   */
  validateNameInput() {
    const name = this.elements.playerNameInput?.value.trim() || '';
    
    if (name.length === 0) {
      this.clearError();
      return;
    }

    if (name.length < GAME_CONFIG.VALIDATION.MIN_NAME_LENGTH) {
      this.showError(`Name must be at least ${GAME_CONFIG.VALIDATION.MIN_NAME_LENGTH} characters`);
      return;
    }

    if (name.length > GAME_CONFIG.VALIDATION.MAX_NAME_LENGTH) {
      this.showError(`Name must be less than ${GAME_CONFIG.VALIDATION.MAX_NAME_LENGTH} characters`);
      return;
    }

    this.clearError();
  }

  /**
   * Save and validate player name
   */
  saveName() {
    const name = this.elements.playerNameInput?.value.trim() || '';
    
    // Validate name
    if (!this.isValidName(name)) {
      return;
    }

    // Sanitize and save name
    this.playerName = Utils.sanitizeInput(name);
    this.savePlayerName(this.playerName);
    
    // Update UI
    if (this.elements.playerNameDisplay) {
      this.elements.playerNameDisplay.textContent = this.playerName;
    }

    this.clearError();
    this.updateStatus(`Welcome ${this.playerName}! Click "Start Game" to begin`);
    
    // Enable start game button
    if (this.elements.startGameButton) {
      this.elements.startGameButton.disabled = false;
    }

    console.log(`Player name saved: ${this.playerName}`);
  }

  /**
   * Validate player name according to game rules
   * @param {string} name - Name to validate
   * @returns {boolean} - True if valid
   */
  isValidName(name) {
    if (!name) {
      this.showError('Please enter your name');
      return false;
    }

    if (name.length < GAME_CONFIG.VALIDATION.MIN_NAME_LENGTH) {
      this.showError(`Name must be at least ${GAME_CONFIG.VALIDATION.MIN_NAME_LENGTH} characters`);
      return false;
    }

    if (name.length > GAME_CONFIG.VALIDATION.MAX_NAME_LENGTH) {
      this.showError(`Name must be less than ${GAME_CONFIG.VALIDATION.MAX_NAME_LENGTH} characters`);
      return false;
    }

    // Check for potentially harmful characters
    const harmfulPattern = /[<>\"'&]/;
    if (harmfulPattern.test(name)) {
      this.showError('Name contains invalid characters');
      return false;
    }

    return true;
  }

  /**
   * Display error message to user
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (this.elements.nameError) {
      this.elements.nameError.textContent = message;
      this.elements.nameError.style.display = 'block';
      this.elements.nameError.setAttribute('aria-live', 'polite');
    }
    
    // Add visual feedback
    if (this.elements.playerNameInput) {
      this.elements.playerNameInput.classList.add('shake');
      this.elements.playerNameInput.setAttribute('aria-invalid', 'true');
      
      setTimeout(() => {
        this.elements.playerNameInput.classList.remove('shake');
      }, 300);
    }
  }

  /**
   * Clear any displayed error messages
   */
  clearError() {
    if (this.elements.nameError) {
      this.elements.nameError.textContent = '';
      this.elements.nameError.style.display = 'none';
    }
    
    if (this.elements.playerNameInput) {
      this.elements.playerNameInput.setAttribute('aria-invalid', 'false');
    }
  }

  /**
   * Start a new game round
   */
  startGame() {
    if (!this.playerName) {
      this.showError('Please enter your name first');
      return;
    }

    try {
      // Remove any existing game end buttons
      const gameEndButtons = Utils.querySelector('.game-end-buttons');
      if (gameEndButtons) {
        gameEndButtons.remove();
      }

      // Reset game state
      this.board = new Array(GAME_CONFIG.BOARD_SIZE).fill('');
      this.currentPlayer = GAME_CONFIG.HUMAN_PLAYER;
      this.gameState = GAME_CONFIG.GAME_STATES.PLAYING;
      
      // Disable input controls during gameplay
      if (this.elements.playerNameInput) {
        this.elements.playerNameInput.disabled = true;
      }
      if (this.elements.saveNameButton) {
        this.elements.saveNameButton.disabled = true;
      }
      if (this.elements.difficultySelect) {
        this.elements.difficultySelect.disabled = true;
      }
      
      // Update UI
      this.updateBoard();
      this.updateStatus(`${this.playerName}'s turn (${GAME_CONFIG.HUMAN_PLAYER})`);
      this.addRestartAnimation();
      this.updateCellTabIndex(true);
      
      console.log('New game started');
    } catch (error) {
      console.error('Error starting game:', error);
      this.handleError('Failed to start game. Please try again.');
    }
  }

  /**
   * Reset the entire game including scores
   */
  resetGame() {
    try {
      // Clear any pending AI moves
      if (this.aiMoveTimeout) {
        clearTimeout(this.aiMoveTimeout);
        this.aiMoveTimeout = null;
      }

      // Remove any existing game end buttons
      const gameEndButtons = Utils.querySelector('.game-end-buttons');
      if (gameEndButtons) {
        gameEndButtons.remove();
      }

      // Reset all game state
      this.board = new Array(GAME_CONFIG.BOARD_SIZE).fill('');
      this.currentPlayer = GAME_CONFIG.HUMAN_PLAYER;
      this.gameState = GAME_CONFIG.GAME_STATES.WAITING;
      this.scores = { player: 0, ai: 0 };
      
      // Enable input controls
      if (this.elements.playerNameInput) {
        this.elements.playerNameInput.disabled = false;
      }
      if (this.elements.saveNameButton) {
        this.elements.saveNameButton.disabled = false;
      }
      if (this.elements.difficultySelect) {
        this.elements.difficultySelect.disabled = false;
      }
      if (this.elements.startGameButton) {
        this.elements.startGameButton.disabled = !this.playerName;
      }
      
      // Update UI
      this.updateBoard();
      this.updateScoreboard();
      this.updateStatus('Enter your name to start playing');
      this.updateCellTabIndex(false);
      
      console.log('Game reset successfully');
    } catch (error) {
      console.error('Error resetting game:', error);
      this.handleError('Failed to reset game. Please refresh the page.');
    }
  }

  /**
   * Handle cell click/selection
   * @param {number} index - Index of clicked cell (0-8)
   */
  handleCellClick(index) {
    // Validate move
    if (!this.isValidMove(index)) {
      return;
    }

    try {
      // Make human player move
      this.makeMove(index, GAME_CONFIG.HUMAN_PLAYER);
      
      // Schedule AI move if game is still active
      if (this.gameState === GAME_CONFIG.GAME_STATES.PLAYING) {
        this.scheduleAIMove();
      }
    } catch (error) {
      console.error('Error handling cell click:', error);
      this.handleError('Failed to make move. Please try again.');
    }
  }

  /**
   * Validate if a move is legal
   * @param {number} index - Cell index to validate
   * @returns {boolean} - True if move is valid
   */
  isValidMove(index) {
    return (
      this.gameState === GAME_CONFIG.GAME_STATES.PLAYING &&
      this.board[index] === '' &&
      this.currentPlayer === GAME_CONFIG.HUMAN_PLAYER &&
      index >= 0 &&
      index < GAME_CONFIG.BOARD_SIZE
    );
  }

  /**
   * Make a move on the board
   * @param {number} index - Cell index (0-8)
   * @param {string} player - Player symbol ('X' or 'O')
   */
  makeMove(index, player) {
    // Update board state
    this.board[index] = player;
    this.updateBoard();
    
    // Check for game end conditions
    const winner = this.checkWinner();
    
    if (winner) {
      this.endGame(winner);
    } else if (this.isBoardFull()) {
      this.endGame('tie');
    } else {
      // Switch players and continue
      this.currentPlayer = player === GAME_CONFIG.HUMAN_PLAYER ? GAME_CONFIG.AI_PLAYER : GAME_CONFIG.HUMAN_PLAYER;
      this.updateStatus(
        this.currentPlayer === GAME_CONFIG.HUMAN_PLAYER 
          ? `${this.playerName}'s turn (${GAME_CONFIG.HUMAN_PLAYER})` 
          : 'AI is thinking...'
      );
    }
  }

  /**
   * Schedule AI move with delay for better user experience
   */
  scheduleAIMove() {
    if (this.gameState !== GAME_CONFIG.GAME_STATES.PLAYING || this.currentPlayer !== GAME_CONFIG.AI_PLAYER) {
      return;
    }

    this.aiMoveTimeout = setTimeout(() => {
      try {
        this.makeAIMove();
      } catch (error) {
        console.error('Error in AI move:', error);
        this.handleError('AI encountered an error. Please restart the game.');
      }
    }, GAME_CONFIG.AI_DELAY);
  }

  /**
   * Execute AI move using minimax algorithm
   */
  makeAIMove() {
    if (this.gameState !== GAME_CONFIG.GAME_STATES.PLAYING || this.currentPlayer !== GAME_CONFIG.AI_PLAYER) {
      return;
    }

    const bestMove = this.getBestMove();
    if (bestMove !== -1) {
      this.makeMove(bestMove, GAME_CONFIG.AI_PLAYER);
    }
  }

  /**
   * Calculate best move for AI using minimax algorithm with difficulty adjustment
   * @returns {number} - Best move index or -1 if no moves available
   */
  getBestMove() {
    const difficultyConfig = GAME_CONFIG.DIFFICULTY_LEVELS[this.difficulty];
    
    // Check if AI should make a random move based on difficulty
    if (Math.random() < difficultyConfig.randomMoveChance) {
      return this.getRandomMove();
    }
    
    // Use minimax for optimal move
    let bestScore = -Infinity;
    let bestMove = -1;

    // Try each empty cell
    for (let i = 0; i < GAME_CONFIG.BOARD_SIZE; i++) {
      if (this.board[i] === '') {
        // Simulate move
        this.board[i] = GAME_CONFIG.AI_PLAYER;
        const score = this.minimax(this.board, 0, false);
        this.board[i] = ''; // Undo move
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove;
  }

  /**
   * Get a random available move for beginner/amateur difficulty
   * @returns {number} - Random move index or -1 if no moves available
   */
  getRandomMove() {
    const availableMoves = [];
    for (let i = 0; i < GAME_CONFIG.BOARD_SIZE; i++) {
      if (this.board[i] === '') {
        availableMoves.push(i);
      }
    }
    
    if (availableMoves.length === 0) return -1;
    
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
  }

  /**
   * Minimax algorithm implementation for optimal AI play
   * @param {Array} board - Current board state
   * @param {number} depth - Current recursion depth
   * @param {boolean} isMaximizing - Whether AI is maximizing player
   * @returns {number} - Score for current position
   */
  minimax(board, depth, isMaximizing) {
    const winner = this.checkWinner();
    
    // Terminal state evaluations
    if (winner === GAME_CONFIG.AI_PLAYER) return 10 - depth;
    if (winner === GAME_CONFIG.HUMAN_PLAYER) return depth - 10;
    if (this.isBoardFull()) return 0;

    if (isMaximizing) {
      // AI's turn - maximize score
      let bestScore = -Infinity;
      for (let i = 0; i < GAME_CONFIG.BOARD_SIZE; i++) {
        if (board[i] === '') {
          board[i] = GAME_CONFIG.AI_PLAYER;
          const score = this.minimax(board, depth + 1, false);
          board[i] = '';
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      // Human's turn - minimize score
      let bestScore = Infinity;
      for (let i = 0; i < GAME_CONFIG.BOARD_SIZE; i++) {
        if (board[i] === '') {
          board[i] = GAME_CONFIG.HUMAN_PLAYER;
          const score = this.minimax(board, depth + 1, true);
          board[i] = '';
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  /**
   * Check for winning combinations
   * @returns {string|null} - Winner symbol or null if no winner
   */
  checkWinner() {
    for (const combination of GAME_CONFIG.WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    return null;
  }

  /**
   * Check if the board is completely filled
   * @returns {boolean} - True if board is full
   */
  isBoardFull() {
    return this.board.every(cell => cell !== '');
  }

  /**
   * End the current game and update scores
   * @param {string} result - Game result ('X', 'O', or 'tie')
   */
  endGame(result) {
    this.gameState = GAME_CONFIG.GAME_STATES.ENDED;
    
    // Clear any pending AI moves
    if (this.aiMoveTimeout) {
      clearTimeout(this.aiMoveTimeout);
      this.aiMoveTimeout = null;
    }

    let message;
    if (result === GAME_CONFIG.HUMAN_PLAYER) {
      message = `🎉 ${this.playerName} wins!`;
      this.scores.player++;
      this.addHighScore(this.playerName, this.scores.player, this.difficulty);
      this.updateGameStats('win');
      this.showPlayAgainButton();
    } else if (result === GAME_CONFIG.AI_PLAYER) {
      message = '🤖 AI wins!';
      this.scores.ai++;
      this.updateGameStats('loss');
      this.showPlayAgainButton();
    } else {
      message = '🤝 It\'s a tie!';
      this.updateGameStats('tie');
      this.showPlayAgainButton();
    }
    
    this.updateStatus(message);
    this.updateScoreboard();
    this.updateHighScores();
    this.updateCellTabIndex(false);
    
    console.log(`Game ended: ${result}`);
  }

  /**
   * Update the visual board representation
   */
  updateBoard() {
    const cells = this.elements.gameBoard?.querySelectorAll('.cell-content');
    
    if (!cells) return;

    cells.forEach((cell, index) => {
      const value = this.board[index];
      cell.textContent = value;
      cell.className = `cell-content ${value.toLowerCase()}`;
      
      // Update accessibility attributes
      const status = value ? `occupied by ${value}` : 'empty';
      cell.setAttribute('aria-label', `Cell ${index + 1}, ${status}`);
      
      // Update interaction state
      if (value || this.gameState !== GAME_CONFIG.GAME_STATES.PLAYING) {
        cell.style.cursor = 'not-allowed';
      } else {
        cell.style.cursor = 'pointer';
      }
    });
  }

  /**
   * Update game status message
   * @param {string} message - Status message to display
   */
  updateStatus(message) {
    if (this.elements.statusDisplay) {
      this.elements.statusDisplay.textContent = message;
    }
  }

  /**
   * Update scoreboard display
   */
  updateScoreboard() {
    if (this.elements.playerScore) {
      this.elements.playerScore.textContent = this.scores.player;
    }
    if (this.elements.aiScore) {
      this.elements.aiScore.textContent = this.scores.ai;
    }
  }

  /**
   * Update cell tab index for keyboard navigation
   * @param {boolean} enabled - Whether cells should be focusable
   */
  updateCellTabIndex(enabled) {
    const cells = this.elements.gameBoard?.querySelectorAll('.cell-content');
    if (!cells) return;

    cells.forEach(cell => {
      cell.setAttribute('tabindex', enabled ? '0' : '-1');
    });
  }

  /**
   * Add restart animation to game board
   */
  addRestartAnimation() {
    if (this.elements.gameBoard) {
      this.elements.gameBoard.classList.add('restart');
      setTimeout(() => {
        this.elements.gameBoard.classList.remove('restart');
      }, 300);
    }
  }

  /**
   * Handle keyboard navigation within the game board
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboardNavigation(e) {
    if (this.gameState !== GAME_CONFIG.GAME_STATES.PLAYING) return;

    const cells = Array.from(this.elements.gameBoard.querySelectorAll('.cell-content'));
    const currentIndex = cells.findIndex(cell => cell === document.activeElement);
    
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        newIndex = currentIndex < 8 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : 8;
        break;
      case 'ArrowDown':
        newIndex = currentIndex < 6 ? currentIndex + 3 : currentIndex - 6;
        break;
      case 'ArrowUp':
        newIndex = currentIndex > 2 ? currentIndex - 3 : currentIndex + 6;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = 8;
        break;
      default:
        return; // Don't prevent default for other keys
    }
    
    e.preventDefault();
    cells[newIndex].focus();
  }

  /**
   * Handle focus events on game board
   * @param {FocusEvent} e - Focus event
   */
  handleBoardFocus(e) {
    // Announce current cell state for screen readers
    const cell = e.target;
    if (cell.classList.contains('cell-content')) {
      const index = parseInt(cell.getAttribute('data-index'));
      const value = this.board[index];
      const announcement = value ? `${value} in cell ${index + 1}` : `Empty cell ${index + 1}`;
      
      // Update aria-live region for screen readers
      if (this.elements.statusDisplay) {
        const originalText = this.elements.statusDisplay.textContent;
        this.elements.statusDisplay.textContent = announcement;
        setTimeout(() => {
          this.elements.statusDisplay.textContent = originalText;
        }, 100);
      }
    }
  }

  /**
   * Show play again button after game ends
   */
  showPlayAgainButton() {
    // Remove existing buttons if they exist
    const existingPlayAgain = Utils.querySelector('.play-again-button');
    const existingStartNew = Utils.querySelector('.start-new-game-button');
    if (existingPlayAgain) existingPlayAgain.remove();
    if (existingStartNew) existingStartNew.remove();

    // Create container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'game-end-buttons';
    buttonContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: center;
      margin-top: var(--spacing-lg);
      width: 100%;
    `;

    // Create play again button (same player, same difficulty)
    const playAgainButton = document.createElement('button');
    playAgainButton.className = 'button primary play-again-button';
    playAgainButton.textContent = `Play Again (${this.playerName})`;
    
    // Add click event
    playAgainButton.addEventListener('click', () => {
      this.startGame();
      buttonContainer.remove();
    });

    // Create start new game button (change player/difficulty)
    const startNewButton = document.createElement('button');
    startNewButton.className = 'button start-new-game-button';
    startNewButton.textContent = 'Start New Game';
    startNewButton.style.background = 'var(--secondary-color)';
    
    // Add click event
    startNewButton.addEventListener('click', () => {
      this.resetToInitialState();
      buttonContainer.remove();
    });

    // Add buttons to container
    buttonContainer.appendChild(playAgainButton);
    buttonContainer.appendChild(startNewButton);

    // Insert after game container
    const gameContainer = Utils.querySelector('.game-container');
    if (gameContainer && gameContainer.parentNode) {
      gameContainer.parentNode.insertBefore(buttonContainer, gameContainer.nextSibling);
    }
  }

  /**
   * Reset to initial state allowing player/difficulty change
   */
  resetToInitialState() {
    try {
      // Clear any pending AI moves
      if (this.aiMoveTimeout) {
        clearTimeout(this.aiMoveTimeout);
        this.aiMoveTimeout = null;
      }

      // Reset game state but keep total scores
      this.board = new Array(GAME_CONFIG.BOARD_SIZE).fill('');
      this.currentPlayer = GAME_CONFIG.HUMAN_PLAYER;
      this.gameState = GAME_CONFIG.GAME_STATES.WAITING;
      
      // Update UI
      this.updateBoard();
      this.updateStatus('Enter your name to start playing');
      this.updateCellTabIndex(false);
      
      // Enable name input and difficulty selection
      if (this.elements.playerNameInput) {
        this.elements.playerNameInput.disabled = false;
      }
      if (this.elements.saveNameButton) {
        this.elements.saveNameButton.disabled = false;
      }
      if (this.elements.difficultySelect) {
        this.elements.difficultySelect.disabled = false;
      }
      if (this.elements.startGameButton) {
        this.elements.startGameButton.disabled = !this.playerName;
      }
      
      console.log('Game reset to initial state');
    } catch (error) {
      console.error('Error resetting to initial state:', error);
      this.handleError('Failed to reset game. Please refresh the page.');
    }
  }

  /**
   * Add high score entry - only keeps highest score per player per difficulty
   * @param {string} name - Player name
   * @param {number} score - Player score
   * @param {string} difficulty - AI difficulty level
   */
  addHighScore(name, score, difficulty) {
    const sanitizedName = Utils.sanitizeInput(name);
    const playerKey = `${sanitizedName}_${difficulty}`;
    
    // Find existing score for this player at this difficulty
    const existingScoreIndex = this.highScores.findIndex(
      scoreEntry => scoreEntry.name === sanitizedName && scoreEntry.difficulty === difficulty
    );
    
    if (existingScoreIndex !== -1) {
      // Update existing score only if new score is higher
      if (score > this.highScores[existingScoreIndex].score) {
        this.highScores[existingScoreIndex] = {
          name: sanitizedName,
          score,
          difficulty,
          difficultyName: GAME_CONFIG.DIFFICULTY_LEVELS[difficulty].name,
          date: new Date().toISOString()
        };
      }
    } else {
      // Add new high score entry
      const newScore = { 
        name: sanitizedName, 
        score, 
        difficulty,
        difficultyName: GAME_CONFIG.DIFFICULTY_LEVELS[difficulty].name,
        date: new Date().toISOString() 
      };
      
      this.highScores.push(newScore);
    }
    
    // Sort by score (highest first), then by date (most recent first)
    this.highScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.date) - new Date(a.date);
    });
    
    // Keep only top scores
    this.highScores = this.highScores.slice(0, GAME_CONFIG.VALIDATION.MAX_HIGH_SCORES);
    
    this.saveHighScores();
  }

  /**
   * Update high scores display
   */
  updateHighScores() {
    if (!this.elements.highScoresList) return;

    if (this.highScores.length === 0) {
      this.elements.highScoresList.innerHTML = '<li>No scores yet</li>';
    } else {
      this.elements.highScoresList.innerHTML = this.highScores
        .map((score, index) => 
          `<li>
            <span class="rank">${index + 1}.</span>
            <span class="name">${score.name}</span>
            <span class="score">${score.score} wins</span>
            <span class="difficulty">(${score.difficultyName || 'Amateur'})</span>
           </li>`
        )
        .join('');
    }
  }

  /**
   * Update game statistics
   * @param {string} result - Game result ('win', 'loss', 'tie')
   */
  updateGameStats(result) {
    this.gameStats.totalGames++;
    this.gameStats[result + 's']++;
    this.gameStats.lastPlayed = new Date().toISOString();
    
    this.saveGameStats();
  }

  /**
   * Handle application errors gracefully
   * @param {string} message - Error message to display to user
   */
  handleError(message) {
    console.error('Game error:', message);
    
    // Display user-friendly error message
    if (this.elements.statusDisplay) {
      this.elements.statusDisplay.textContent = `Error: ${message}`;
      this.elements.statusDisplay.style.color = 'var(--accent-color)';
      
      // Reset color after delay
      setTimeout(() => {
        this.elements.statusDisplay.style.color = '';
      }, 5000);
    }
  }

  /**
   * Load high scores from localStorage
   * @returns {Array} - Array of high score objects
   */
  loadHighScores() {
    try {
      const scores = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.HIGH_SCORES);
      return scores ? JSON.parse(scores) : [];
    } catch (error) {
      console.error('Error loading high scores:', error);
      return [];
    }
  }

  /**
   * Save high scores to localStorage
   */
  saveHighScores() {
    try {
      localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.HIGH_SCORES, JSON.stringify(this.highScores));
    } catch (error) {
      console.error('Error saving high scores:', error);
    }
  }

  /**
   * Load last used player name
   */
  loadLastPlayerName() {
    try {
      const lastPlayerName = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.PLAYER_NAME);
      if (lastPlayerName && this.elements.playerNameInput) {
        this.elements.playerNameInput.value = lastPlayerName;
      }
    } catch (error) {
      console.error('Error loading last player name:', error);
    }
  }

  /**
   * Save player name for future sessions
   * @param {string} name - Player name to save
   */
  savePlayerName(name) {
    try {
      localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.PLAYER_NAME, name);
    } catch (error) {
      console.error('Error saving player name:', error);
    }
  }

  /**
   * Load game statistics
   * @returns {Object} - Game statistics object
   */
  loadGameStats() {
    try {
      const stats = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.GAME_STATS);
      return stats ? JSON.parse(stats) : {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        lastPlayed: null
      };
    } catch (error) {
      console.error('Error loading game stats:', error);
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        lastPlayed: null
      };
    }
  }

  /**
   * Save game statistics
   */
  saveGameStats() {
    try {
      localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.GAME_STATS, JSON.stringify(this.gameStats));
    } catch (error) {
      console.error('Error saving game stats:', error);
    }
  }

  /**
   * Setup difficulty selector dropdown
   */
  setupDifficultySelector() {
    if (!this.elements.difficultySelect) return;
    
    // Set current difficulty as selected
    this.elements.difficultySelect.value = this.difficulty;
    
    // Update status to show current difficulty
    this.updateDifficultyDisplay();
  }

  /**
   * Change AI difficulty level
   * @param {string} newDifficulty - New difficulty level
   */
  changeDifficulty(newDifficulty) {
    if (GAME_CONFIG.DIFFICULTY_LEVELS[newDifficulty]) {
      this.difficulty = newDifficulty;
      this.saveDifficulty(newDifficulty);
      this.updateDifficultyDisplay();
      console.log(`Difficulty changed to: ${newDifficulty}`);
    }
  }

  /**
   * Update difficulty display in status
   */
  updateDifficultyDisplay() {
    const difficultyConfig = GAME_CONFIG.DIFFICULTY_LEVELS[this.difficulty];
    if (this.gameState === GAME_CONFIG.GAME_STATES.WAITING) {
      this.updateStatus(`Enter your name to start playing (AI: ${difficultyConfig.name} - ${difficultyConfig.description})`);
    }
  }

  /**
   * Load difficulty setting from localStorage
   * @returns {string} - Saved difficulty or default 'AMATEUR'
   */
  loadDifficulty() {
    try {
      const savedDifficulty = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.DIFFICULTY);
      return savedDifficulty && GAME_CONFIG.DIFFICULTY_LEVELS[savedDifficulty] ? savedDifficulty : 'AMATEUR';
    } catch (error) {
      console.error('Error loading difficulty:', error);
      return 'AMATEUR';
    }
  }

  /**
   * Save difficulty setting to localStorage
   * @param {string} difficulty - Difficulty level to save
   */
  saveDifficulty(difficulty) {
    try {
      localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.DIFFICULTY, difficulty);
    } catch (error) {
      console.error('Error saving difficulty:', error);
    }
  }

  /**
   * Clean up resources and event listeners
   */
  cleanup() {
    if (this.aiMoveTimeout) {
      clearTimeout(this.aiMoveTimeout);
      this.aiMoveTimeout = null;
    }
  }
}

// ================================
// TIMELINE ANIMATIONS CLASS
// ================================

/**
 * Timeline animation controller using Intersection Observer API
 * Provides smooth scroll-triggered animations for timeline events
 */
class TimelineAnimations {
  /**
   * Initialize timeline animations
   */
  constructor() {
    this.timelineEvents = Utils.querySelectorAll('.event');
    this.observer = null;
    this.animationThreshold = 0.1;
    
    this.init();
  }

  /**
   * Initialize timeline animations with feature detection
   */
  init() {
    if ('IntersectionObserver' in window && this.timelineEvents.length > 0) {
      this.setupIntersectionObserver();
    } else {
      // Fallback for older browsers or when no timeline events exist
      this.showAllEvents();
    }
  }

  /**
   * Set up Intersection Observer for scroll-triggered animations
   */
  setupIntersectionObserver() {
    const options = {
      threshold: this.animationThreshold,
      rootMargin: '0px 0px -50px 0px' // Trigger animation slightly before element is fully visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateTimelineEvent(entry.target);
        }
      });
    }, options);

    // Prepare and observe timeline events
    this.timelineEvents.forEach(event => {
      this.prepareTimelineEvent(event);
      this.observer.observe(event);
    });

    console.log(`Timeline animations initialized for ${this.timelineEvents.length} events`);
  }

  /**
   * Prepare timeline event for animation
   * @param {Element} event - Timeline event element
   */
  prepareTimelineEvent(event) {
    event.style.opacity = '0';
    event.style.transform = 'translateY(30px)';
    event.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
  }

  /**
   * Animate timeline event when it comes into view
   * @param {Element} event - Timeline event element to animate
   */
  animateTimelineEvent(event) {
    event.style.opacity = '1';
    event.style.transform = 'translateY(0)';
    
    // Stop observing this element after animation
    if (this.observer) {
      this.observer.unobserve(event);
    }
  }

  /**
   * Show all timeline events immediately (fallback)
   */
  showAllEvents() {
    this.timelineEvents.forEach(event => {
      event.style.opacity = '1';
      event.style.transform = 'translateY(0)';
      event.style.transition = 'none';
    });
  }

  /**
   * Clean up observer resources
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// ================================
// SMOOTH SCROLLING MODULE
// ================================

/**
 * Smooth scrolling functionality for anchor links
 */
class SmoothScrolling {
  /**
   * Initialize smooth scrolling for anchor links
   */
  constructor() {
    this.init();
  }

  /**
   * Set up smooth scrolling event listeners
   */
  init() {
    const anchors = Utils.querySelectorAll('a[href^="#"]');
    
    anchors.forEach(anchor => {
      anchor.addEventListener('click', (e) => this.handleAnchorClick(e, anchor));
    });

    console.log(`Smooth scrolling initialized for ${anchors.length} anchor links`);
  }

  /**
   * Handle anchor link clicks for smooth scrolling
   * @param {Event} e - Click event
   * @param {Element} anchor - Anchor element
   */
  handleAnchorClick(e, anchor) {
    const href = anchor.getAttribute('href');
    
    // Skip empty anchors or external links
    if (href === '#' || href.startsWith('http')) return;
    
    const target = Utils.querySelector(href);
    if (target) {
      e.preventDefault();
      
      // Calculate scroll position with offset for fixed headers
      const headerOffset = 80; // Adjust based on header height
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update focus for accessibility
      target.focus({ preventScroll: true });
    }
  }
}

// ================================
// MAIN APPLICATION CLASS
// ================================

/**
 * Main application controller that orchestrates all components
 */
class PortfolioApp {
  /**
   * Initialize the portfolio application
   */
  constructor() {
    this.components = {};
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Initialize the application when DOM is ready
   */
  init() {
    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Set up all application components
   */
  setup() {
    try {
      console.log('Portfolio application initializing...');
      
      // Initialize timeline animations
      this.components.timelineAnimations = new TimelineAnimations();
      
      // Initialize Tic-Tac-Toe game if game board exists
      const gameBoard = Utils.querySelector('#gameBoard');
      if (gameBoard) {
        this.components.ticTacToe = new TicTacToe();
      }
      
      // Initialize smooth scrolling
      this.components.smoothScrolling = new SmoothScrolling();
      
      // Set up fade-in animations
      this.setupFadeInAnimations();
      
      // Set up performance optimizations
      this.setupPerformanceOptimizations();
      
      // Mark body as loaded for CSS animations
      document.body.classList.add('loaded');
      document.body.classList.remove('is-preload');
      
      this.isInitialized = true;
      console.log('Portfolio application initialized successfully');
      
    } catch (error) {
      console.error('Error initializing portfolio application:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Set up fade-in animations for page elements
   */
  setupFadeInAnimations() {
    const fadeElements = Utils.querySelectorAll('.fade-in');
    
    fadeElements.forEach((element, index) => {
      // Stagger animations for better visual effect
      const delay = index * 150; // 150ms between each element
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, delay);
    });

    console.log(`Fade-in animations set up for ${fadeElements.length} elements`);
  }

  /**
   * Set up performance optimizations
   */
  setupPerformanceOptimizations() {
    // Lazy load images that are not in viewport
    this.setupLazyLoading();
    
    // Optimize scroll event handling
    this.setupScrollOptimization();
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  /**
   * Set up lazy loading for images
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      const lazyImages = Utils.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }

  /**
   * Optimize scroll event handling
   */
  setupScrollOptimization() {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Add scroll-dependent functionality here
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    // Preload critical CSS (if using external stylesheets)
    const criticalCSS = [
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'
    ];

    criticalCSS.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  /**
   * Handle initialization errors gracefully
   * @param {Error} error - Initialization error
   */
  handleInitializationError(error) {
    // Log error for debugging
    console.error('Portfolio application failed to initialize:', error);
    
    // Show user-friendly fallback
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-banner';
    errorMessage.textContent = 'Some features may not work properly. Please refresh the page.';
    errorMessage.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #e74c3c;
      color: white;
      text-align: center;
      padding: 10px;
      z-index: 10000;
    `;
    
    document.body.insertBefore(errorMessage, document.body.firstChild);
    
    // Auto-hide error banner after 5 seconds
    setTimeout(() => {
      if (errorMessage.parentNode) {
        errorMessage.parentNode.removeChild(errorMessage);
      }
    }, 5000);
  }

  /**
   * Clean up application resources
   */
  destroy() {
    try {
      // Clean up all components
      Object.values(this.components).forEach(component => {
        if (component && typeof component.destroy === 'function') {
          component.destroy();
        }
      });
      
      this.components = {};
      this.isInitialized = false;
      
      console.log('Portfolio application cleaned up');
    } catch (error) {
      console.error('Error during application cleanup:', error);
    }
  }
}

// ================================
// ERROR HANDLING & MONITORING
// ================================

/**
 * Global error handlers for debugging and monitoring
 */

// Handle uncaught JavaScript errors
window.addEventListener('error', (e) => {
  console.error('Global JavaScript error:', {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error
  });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// ================================
// APPLICATION INITIALIZATION
// ================================

// Initialize the application
let app;

try {
  app = new PortfolioApp();
} catch (error) {
  console.error('Failed to create portfolio application:', error);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (app && typeof app.destroy === 'function') {
    app.destroy();
  }
});

// Export for potential module usage or testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    PortfolioApp, 
    TicTacToe, 
    TimelineAnimations, 
    SmoothScrolling,
    Utils,
    GAME_CONFIG
  };
}

// Make available globally for debugging (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.PortfolioDebug = {
    app,
    Utils,
    GAME_CONFIG
  };
}

// ================================
// END OF MAIN SCRIPT
// ================================

console.log('Portfolio JavaScript module loaded successfully');

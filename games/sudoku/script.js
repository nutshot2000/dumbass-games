// Sudoku Game Logic
document.addEventListener('DOMContentLoaded', function() {
    // Game state
    const game = {
        board: Array(9).fill().map(() => Array(9).fill(0)),
        solution: Array(9).fill().map(() => Array(9).fill(0)),
        initialBoard: Array(9).fill().map(() => Array(9).fill(0)),
        selectedCell: null,
        difficulty: 'easy',
        gameStarted: false,
        gamePaused: false,
        timer: 0,
        timerInterval: null,
        hintsUsed: 0,
        maxHints: 3
    };

    // DOM elements
    const boardElement = document.getElementById('sudoku-board');
    const timerElement = document.getElementById('timer');
    const difficultySelect = document.getElementById('difficulty');
    const newGameBtn = document.getElementById('new-game-btn');
    const hintBtn = document.getElementById('hint-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const gameStatusElement = document.getElementById('game-status');
    const pauseModal = document.getElementById('pause-modal');
    const victoryModal = document.getElementById('victory-modal');
    const completionTimeElement = document.getElementById('completion-time');
    const numberButtons = document.querySelectorAll('.number-btn');

    // Initialize the game
    function initGame() {
        console.log("Initializing Sudoku game...");
        createBoard();
        setupEventListeners();
        
        // Start a new game immediately without delay
        newGame();
        
        // Show a welcome message with instructions
        showStatus("Game started! Click on an empty cell, then enter a number using the buttons below.", 'info', 8000);
    }

    // Create the Sudoku board in the DOM
    function createBoard() {
        console.log("Creating Sudoku board...");
        boardElement.innerHTML = '';
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
        console.log("Board created with " + boardElement.children.length + " cells");
    }

    // Set up event listeners
    function setupEventListeners() {
        console.log("Setting up event listeners...");
        
        // Cell selection
        boardElement.addEventListener('click', handleCellClick);
        
        // Number input
        numberButtons.forEach(button => {
            button.addEventListener('click', handleNumberInput);
        });
        
        // Keyboard input
        document.addEventListener('keydown', handleKeyDown);
        
        // Game controls
        newGameBtn.addEventListener('click', function() {
            console.log("New Game button clicked");
            newGame();
        });
        
        hintBtn.addEventListener('click', function() {
            console.log("Hint button clicked");
            giveHint();
        });
        
        checkBtn.addEventListener('click', function() {
            console.log("Check button clicked");
            checkProgress();
        });
        
        solveBtn.addEventListener('click', function() {
            console.log("Solve button clicked");
            solveGame();
        });
        
        pauseBtn.addEventListener('click', function() {
            console.log("Pause button clicked");
            togglePause();
        });
        
        resumeBtn.addEventListener('click', function() {
            console.log("Resume button clicked");
            togglePause();
        });
        
        playAgainBtn.addEventListener('click', function() {
            console.log("Play Again button clicked");
            newGame();
        });
        
        // Difficulty selection
        difficultySelect.addEventListener('change', function() {
            console.log("Difficulty changed to: " + this.value);
            game.difficulty = this.value;
            if (game.gameStarted) {
                if (confirm('Changing difficulty will start a new game. Continue?')) {
                    newGame();
                } else {
                    difficultySelect.value = game.difficulty;
                }
            }
        });
    }

    // Handle cell click
    function handleCellClick(event) {
        if (!game.gameStarted || game.gamePaused) return;
        
        const cell = event.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        console.log(`Cell clicked: row ${row}, col ${col}`);
        
        // Don't allow changing fixed cells
        if (game.initialBoard[row][col] !== 0) {
            showStatus("This cell is fixed and cannot be changed.", 'info');
            return;
        }
        
        // Deselect previous cell
        if (game.selectedCell) {
            const prevCell = getCellElement(game.selectedCell.row, game.selectedCell.col);
            prevCell.classList.remove('selected');
            
            // Remove highlights from related cells
            removeHighlights();
        }
        
        // Select new cell
        game.selectedCell = { row, col };
        cell.classList.add('selected');
        
        // Highlight related cells (same row, column, and box)
        highlightRelatedCells(row, col);
        
        // Show a helpful message for new players
        showStatus("Now enter a number using the buttons below or your keyboard (1-9).", 'info');
    }

    // Handle number input from buttons
    function handleNumberInput(event) {
        if (!game.gameStarted || game.gamePaused || !game.selectedCell) {
            if (!game.selectedCell) {
                showStatus("First select a cell, then enter a number.", 'info');
            }
            return;
        }
        
        const number = parseInt(event.target.dataset.number);
        const { row, col } = game.selectedCell;
        
        console.log(`Number ${number} entered for cell: row ${row}, col ${col}`);
        
        // Don't allow changing fixed cells
        if (game.initialBoard[row][col] !== 0) {
            showStatus("This cell is fixed and cannot be changed.", 'info');
            return;
        }
        
        // Update the board
        if (number === 0) {
            // Erase
            game.board[row][col] = 0;
            updateCellDisplay(row, col, '');
            getCellElement(row, col).classList.remove('error');
            showStatus("Cell cleared.", 'info');
        } else {
            game.board[row][col] = number;
            updateCellDisplay(row, col, number);
            
            // Check if the number matches the solution
            if (number !== game.solution[row][col]) {
                getCellElement(row, col).classList.add('error');
                showStatus("This number doesn't match the solution.", 'error');
            } else {
                getCellElement(row, col).classList.remove('error');
                showStatus("Correct number!", 'success');
            }
        }
        
        // Check if the game is complete
        if (isBoardFilled() && isBoardValid()) {
            endGame(true);
        }
    }

    // Handle keyboard input
    function handleKeyDown(event) {
        if (!game.gameStarted || game.gamePaused || !game.selectedCell) return;
        
        const { row, col } = game.selectedCell;
        
        // Don't allow changing fixed cells
        if (game.initialBoard[row][col] !== 0) return;
        
        // Number keys (1-9)
        if (event.key >= '1' && event.key <= '9') {
            const number = parseInt(event.key);
            game.board[row][col] = number;
            updateCellDisplay(row, col, number);
            
            // Check if the number matches the solution
            if (number !== game.solution[row][col]) {
                getCellElement(row, col).classList.add('error');
                showStatus("This number doesn't match the solution.", 'error');
            } else {
                getCellElement(row, col).classList.remove('error');
                showStatus("Correct number!", 'success');
            }
            
            // Check if the game is complete
            if (isBoardFilled() && isBoardValid()) {
                endGame(true);
            }
        }
        
        // Delete or Backspace to erase
        if (event.key === 'Delete' || event.key === 'Backspace') {
            game.board[row][col] = 0;
            updateCellDisplay(row, col, '');
            getCellElement(row, col).classList.remove('error');
        }
        
        // Arrow keys to navigate
        if (event.key.startsWith('Arrow')) {
            event.preventDefault();
            navigateWithArrowKeys(event.key);
        }
    }

    // Navigate cells with arrow keys
    function navigateWithArrowKeys(key) {
        if (!game.selectedCell) return;
        
        let { row, col } = game.selectedCell;
        
        switch (key) {
            case 'ArrowUp':
                row = (row - 1 + 9) % 9;
                break;
            case 'ArrowDown':
                row = (row + 1) % 9;
                break;
            case 'ArrowLeft':
                col = (col - 1 + 9) % 9;
                break;
            case 'ArrowRight':
                col = (col + 1) % 9;
                break;
        }
        
        // Deselect previous cell
        const prevCell = getCellElement(game.selectedCell.row, game.selectedCell.col);
        prevCell.classList.remove('selected');
        
        // Remove highlights
        removeHighlights();
        
        // Select new cell
        game.selectedCell = { row, col };
        const newCell = getCellElement(row, col);
        newCell.classList.add('selected');
        
        // Highlight related cells
        highlightRelatedCells(row, col);
    }

    // Highlight cells in the same row, column, and box
    function highlightRelatedCells(row, col) {
        // Highlight same row
        for (let c = 0; c < 9; c++) {
            if (c !== col) {
                getCellElement(row, c).classList.add('highlighted');
            }
        }
        
        // Highlight same column
        for (let r = 0; r < 9; r++) {
            if (r !== row) {
                getCellElement(r, col).classList.add('highlighted');
            }
        }
        
        // Highlight same 3x3 box
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        
        for (let r = boxStartRow; r < boxStartRow + 3; r++) {
            for (let c = boxStartCol; c < boxStartCol + 3; c++) {
                if (r !== row || c !== col) {
                    getCellElement(r, c).classList.add('highlighted');
                }
            }
        }
        
        // Highlight same number
        const number = game.board[row][col];
        if (number !== 0) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if ((r !== row || c !== col) && game.board[r][c] === number) {
                        const cell = getCellElement(r, c);
                        cell.classList.add('same-number');
                        // Remove the highlighted class if it has it
                        cell.classList.remove('highlighted');
                    }
                }
            }
        }
    }

    // Remove all highlights
    function removeHighlights() {
        const highlightedCells = document.querySelectorAll('.cell.highlighted');
        highlightedCells.forEach(cell => {
            cell.classList.remove('highlighted');
        });
        
        const sameNumberCells = document.querySelectorAll('.cell.same-number');
        sameNumberCells.forEach(cell => {
            cell.classList.remove('same-number');
        });
    }

    // Get cell element by row and column
    function getCellElement(row, col) {
        return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    // Update cell display
    function updateCellDisplay(row, col, value) {
        const cell = getCellElement(row, col);
        cell.textContent = value;
        
        // Add appropriate class based on whether it's a fixed cell or user input
        if (game.initialBoard[row][col] !== 0) {
            cell.classList.add('fixed');
            cell.classList.remove('user-input');
        } else {
            cell.classList.add('user-input');
            cell.classList.remove('fixed');
        }
    }

    // Start a new game
    function newGame() {
        console.log("Starting new game...");
        
        // Reset game state
        resetGame();
        
        // Generate a new puzzle
        generatePuzzle();
        
        // Update the board display
        updateBoardDisplay();
        
        // Start the timer
        startTimer();
        
        // Set game as started
        game.gameStarted = true;
        game.gamePaused = false;
        
        // Hide modals
        pauseModal.classList.remove('active');
        victoryModal.classList.remove('active');
        
        // Update status
        showStatus('New game started! Click on an empty cell to select it, then enter a number.', 'info', 5000);
        
        // Reset hints
        game.hintsUsed = 0;
        updateHintButton();
        
        console.log("New game started successfully");
    }

    // Reset the game state
    function resetGame() {
        game.board = Array(9).fill().map(() => Array(9).fill(0));
        game.solution = Array(9).fill().map(() => Array(9).fill(0));
        game.initialBoard = Array(9).fill().map(() => Array(9).fill(0));
        game.selectedCell = null;
        game.timer = 0;
        
        // Clear timer interval
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }
        
        // Update timer display
        updateTimerDisplay();
        
        // Clear board selection and highlights
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('selected', 'highlighted', 'error', 'hint');
            cell.textContent = '';
        });
    }

    // Generate a Sudoku puzzle
    function generatePuzzle() {
        console.log("Generating puzzle...");
        
        // First, generate a solved board
        generateSolvedBoard();
        
        // Copy the solution
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                game.board[row][col] = game.solution[row][col];
            }
        }
        
        // Remove numbers based on difficulty
        const cellsToRemove = getDifficultyRemovalCount();
        console.log(`Will remove ${cellsToRemove} cells based on difficulty: ${game.difficulty}`);
        removeNumbers(cellsToRemove);
        
        // Count empty cells to verify
        let emptyCells = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] === 0) {
                    emptyCells++;
                }
            }
        }
        console.log(`Board now has ${emptyCells} empty cells`);
        
        // Save the initial board state
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                game.initialBoard[row][col] = game.board[row][col];
            }
        }
        
        console.log("Puzzle generated successfully");
    }

    // Generate a solved Sudoku board
    function generateSolvedBoard() {
        // Clear the solution board
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                game.solution[row][col] = 0;
            }
        }
        
        // Fill the board using backtracking
        solveSudoku(game.solution);
    }

    // Solve the Sudoku using backtracking algorithm
    function solveSudoku(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // Find an empty cell
                if (board[row][col] === 0) {
                    // Try placing numbers 1-9
                    const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (let i = 0; i < numbers.length; i++) {
                        const num = numbers[i];
                        
                        // Check if the number can be placed
                        if (isValidPlacement(row, col, num, board)) {
                            // Place the number
                            board[row][col] = num;
                            
                            // Recursively try to solve the rest of the board
                            if (solveSudoku(board)) {
                                return true;
                            }
                            
                            // If we couldn't solve the board, backtrack
                            board[row][col] = 0;
                        }
                    }
                    
                    // If no number works, return false to trigger backtracking
                    return false;
                }
            }
        }
        
        // If we've filled all cells, the board is solved
        return true;
    }

    // Check if a number can be placed at a position
    function isValidPlacement(row, col, num, board = game.board) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && board[row][c] === num) {
                return false;
            }
        }
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (r !== row && board[r][col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        
        for (let r = boxStartRow; r < boxStartRow + 3; r++) {
            for (let c = boxStartCol; c < boxStartCol + 3; c++) {
                if ((r !== row || c !== col) && board[r][c] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // Remove numbers from the board based on difficulty
    function removeNumbers(count) {
        console.log(`Removing ${count} numbers from the board...`);
        
        // Create a list of all positions
        const positions = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push({ row, col });
            }
        }
        
        // Shuffle the positions
        const shuffledPositions = shuffleArray(positions);
        
        // Remove numbers one by one
        let removed = 0;
        for (let i = 0; i < shuffledPositions.length && removed < count; i++) {
            const { row, col } = shuffledPositions[i];
            
            // Remove the number
            game.board[row][col] = 0;
            removed++;
        }
        
        console.log(`Successfully removed ${removed} numbers`);
    }

    // Check if the puzzle has multiple solutions
    function hasMultipleSolutions() {
        // For simplicity, we'll just check if the puzzle is solvable
        // A more thorough check would be to count all possible solutions
        
        // Create a copy of the board
        const boardCopy = [];
        for (let row = 0; row < 9; row++) {
            boardCopy[row] = [...game.board[row]];
        }
        
        // Try to solve it
        return solveSudoku(boardCopy);
    }

    // Get the number of cells to remove based on difficulty
    function getDifficultyRemovalCount() {
        switch (game.difficulty) {
            case 'easy':
                return 40; // 41 clues
            case 'medium':
                return 55; // 26 clues
            case 'hard':
                return 65; // 16 clues
            default:
                return 40;
        }
    }

    // Update the board display
    function updateBoardDisplay() {
        console.log("Updating board display...");
        let emptyCellsDisplayed = 0;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = game.board[row][col] === 0 ? '' : game.board[row][col];
                if (value === '') {
                    emptyCellsDisplayed++;
                }
                updateCellDisplay(row, col, value);
            }
        }
        
        console.log(`Board display updated with ${emptyCellsDisplayed} empty cells`);
    }

    // Start the timer
    function startTimer() {
        // Reset timer
        game.timer = 0;
        updateTimerDisplay();
        
        // Clear existing interval
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
        }
        
        // Start new interval
        game.timerInterval = setInterval(function() {
            if (!game.gamePaused) {
                game.timer++;
                updateTimerDisplay();
            }
        }, 1000);
    }

    // Update the timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(game.timer / 60);
        const seconds = game.timer % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Toggle pause/resume
    function togglePause() {
        if (!game.gameStarted) return;
        
        game.gamePaused = !game.gamePaused;
        
        if (game.gamePaused) {
            pauseModal.classList.add('active');
            pauseBtn.textContent = 'Resume';
            showStatus("Game paused", 'info');
        } else {
            pauseModal.classList.remove('active');
            pauseBtn.textContent = 'Pause';
            showStatus("Game resumed", 'info');
        }
    }

    // Give a hint
    function giveHint() {
        if (!game.gameStarted || game.gamePaused) return;
        
        // Check if hints are available
        if (game.hintsUsed >= game.maxHints) {
            showStatus('No more hints available!', 'error');
            return;
        }
        
        // Find an empty or incorrect cell
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] === 0 || game.board[row][col] !== game.solution[row][col]) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) {
            showStatus('No cells need hints!', 'info');
            return;
        }
        
        // Randomly select a cell to give a hint for
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randomIndex];
        
        // Fill in the correct value
        game.board[row][col] = game.solution[row][col];
        updateCellDisplay(row, col, game.solution[row][col]);
        
        // Highlight the hint
        const cell = getCellElement(row, col);
        cell.classList.add('hint');
        
        // Increment hints used
        game.hintsUsed++;
        updateHintButton();
        
        // Show status
        showStatus('Hint used! The correct number has been filled in.', 'info');
        
        // Check if the game is complete
        if (isBoardFilled() && isBoardValid()) {
            endGame(true);
        }
    }

    // Update hint button text
    function updateHintButton() {
        hintBtn.textContent = `Hint (${game.maxHints - game.hintsUsed})`;
        
        if (game.hintsUsed >= game.maxHints) {
            hintBtn.disabled = true;
        } else {
            hintBtn.disabled = false;
        }
    }

    // Check the current progress
    function checkProgress() {
        if (!game.gameStarted || game.gamePaused) return;
        
        let errors = 0;
        
        // Check each cell
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = getCellElement(row, col);
                
                // Skip empty cells
                if (game.board[row][col] === 0) continue;
                
                // Check if the value matches the solution
                if (game.board[row][col] !== game.solution[row][col]) {
                    cell.classList.add('error');
                    errors++;
                } else {
                    cell.classList.remove('error');
                }
            }
        }
        
        // Show status
        if (errors === 0) {
            if (isBoardFilled()) {
                endGame(true);
            } else {
                showStatus('Looking good! All numbers are correct so far. Keep going!', 'success');
            }
        } else {
            showStatus(`Found ${errors} error${errors === 1 ? '' : 's'}. Red cells contain incorrect numbers.`, 'error');
        }
    }

    // Solve the game
    function solveGame() {
        if (!game.gameStarted || game.gamePaused) return;
        
        if (confirm('Are you sure you want to see the solution? This will end the current game.')) {
            // Fill in the solution
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    game.board[row][col] = game.solution[row][col];
                    updateCellDisplay(row, col, game.solution[row][col]);
                }
            }
            
            // End the game
            endGame(false);
            
            // Show status
            showStatus('Puzzle solved! Click "New Game" to play again.', 'info');
        }
    }

    // End the game
    function endGame(victory) {
        // Stop the timer
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }
        
        // Set game as not started
        game.gameStarted = false;
        
        if (victory) {
            // Show victory modal
            completionTimeElement.textContent = `Time: ${timerElement.textContent}`;
            victoryModal.classList.add('active');
            
            // Show status
            showStatus('Congratulations! You solved the puzzle!', 'success');
        }
    }

    // Check if the board is completely filled
    function isBoardFilled() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the board is valid
    function isBoardValid() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] !== 0 && game.board[row][col] !== game.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Show status message
    function showStatus(message, type, duration = 3000) {
        gameStatusElement.textContent = message;
        gameStatusElement.className = 'game-status';
        
        if (type) {
            gameStatusElement.classList.add(`status-${type}`);
        }
        
        // Clear the status after a delay
        setTimeout(() => {
            gameStatusElement.textContent = '';
            gameStatusElement.className = 'game-status';
        }, duration);
    }

    // Utility function to shuffle an array
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Initialize the game
    initGame();
}); 
/**
 * Snake Game - A classic arcade game implemented in JavaScript
 * For Dumbass Games (dumbassgames.xyz)
 */

// Game configuration
const config = {
    initialSpeed: 150,      // Starting game speed (milliseconds)
    speedIncrement: 5,      // How much to decrease interval per level
    gridSize: 20,           // Size of the game grid
    foodValue: 10,          // Score value for each food item
    levelUpScore: 100,      // Score required to level up
    maxLevel: 10,           // Maximum game level
    colors: {
        snake: {
            head: getComputedStyle(document.documentElement).getPropertyValue('--snake-head').trim() || '#ff6b6b',
            body: getComputedStyle(document.documentElement).getPropertyValue('--snake-body').trim() || '#4ecdc4'
        },
        food: getComputedStyle(document.documentElement).getPropertyValue('--food').trim() || '#ffd166',
        grid: getComputedStyle(document.documentElement).getPropertyValue('--game-grid').trim() || '#1e1e1e',
        background: getComputedStyle(document.documentElement).getPropertyValue('--game-bg').trim() || '#121212'
    },
    achievementThresholds: {
        score: [100, 500],
        snakeLength: [10, 20],
        gamesPlayed: [10]
    }
};

// Game state
const gameState = {
    snake: [],
    food: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    nextDirection: { x: 0, y: 0 },
    isPlaying: false,
    isPaused: false,
    score: 0,
    level: 1,
    speed: config.initialSpeed,
    gameLoop: null,
    gamesPlayed: 0,
    highScores: [],
    longestSnake: 0,
    achievements: {
        firstGame: false,
        score100: false,
        score500: false,
        snake10: false,
        snake20: false,
        dedicated: false
    }
};

// DOM Elements
const elements = {
    canvas: document.getElementById('gameCanvas'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startButton: document.getElementById('startButton'),
    pauseButton: document.getElementById('pauseButton'),
    resetButton: document.getElementById('resetButton'),
    restartButton: document.getElementById('restartButton'),
    scoreDisplay: document.getElementById('score'),
    levelDisplay: document.getElementById('level'),
    highScoreDisplay: document.getElementById('highScore'),
    finalScoreDisplay: document.getElementById('finalScore'),
    finalHighScoreDisplay: document.getElementById('finalHighScore'),
    gamesPlayedDisplay: document.getElementById('gamesPlayed'),
    bestScoreDisplay: document.getElementById('bestScore'),
    longestSnakeDisplay: document.getElementById('longestSnake'),
    highScoresList: document.getElementById('highScoresList'),
    difficultyButtons: document.querySelectorAll('.difficulty-button'),
    postGameAd: document.getElementById('postGameAd'),
    achievementsGrid: document.getElementById('achievementsGrid'),
    mobileControls: {
        up: document.getElementById('upButton'),
        down: document.getElementById('downButton'),
        left: document.getElementById('leftButton'),
        right: document.getElementById('rightButton')
    },
    shareButtons: {
        twitter: document.getElementById('shareTwitter'),
        facebook: document.getElementById('shareFacebook'),
        whatsapp: document.getElementById('shareWhatsapp')
    }
};

// Canvas context
const ctx = elements.canvas ? elements.canvas.getContext('2d') : null;

/**
 * Initialize the game
 */
function initGame() {
    try {
        // Set up event listeners
        setupEventListeners();
        
        // Load saved game data from localStorage
        loadGameData();
        
        // Update UI with initial data
        updateUI();
        
        // Initialize canvas size
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Set up achievements
        updateAchievements();
    } catch (error) {
        console.error("Error initializing game:", error);
        // Try to recover by at least setting up the basic event listeners
        try {
            setupEventListeners();
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        } catch (fallbackError) {
            console.error("Critical initialization failure:", fallbackError);
            // Display a message to the user if everything fails
            alert("There was an error loading the game. Please refresh the page or try again later.");
        }
    }
}

/**
 * Set up event listeners for game controls
 */
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Game control buttons
    if (elements.startButton) {
        elements.startButton.addEventListener('click', startGame);
    }
    
    if (elements.pauseButton) {
        elements.pauseButton.addEventListener('click', togglePause);
    }
    
    if (elements.resetButton) {
        elements.resetButton.addEventListener('click', resetGame);
    }
    
    if (elements.restartButton) {
        elements.restartButton.addEventListener('click', () => {
            hideGameOverScreen();
            resetGame();
            startGame();
        });
    }
    
    // Difficulty buttons
    elements.difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            elements.difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameState.speed = parseInt(button.dataset.speed);
        });
    });
    
    // Mobile touch controls
    Object.keys(elements.mobileControls).forEach(direction => {
        const button = elements.mobileControls[direction];
        if (button) {
            button.addEventListener('click', () => {
                handleMobileDirection(direction);
            });
        }
    });
    
    // Mobile swipe controls
    setupTouchControls();
    
    // Share buttons
    if (elements.shareButtons.twitter) {
        elements.shareButtons.twitter.addEventListener('click', shareOnTwitter);
    }
    
    if (elements.shareButtons.facebook) {
        elements.shareButtons.facebook.addEventListener('click', shareOnFacebook);
    }
    
    if (elements.shareButtons.whatsapp) {
        elements.shareButtons.whatsapp.addEventListener('click', shareOnWhatsApp);
    }
}

/**
 * Handle key presses for snake movement
 */
function handleKeyDown(event) {
    // Ignore keypresses if not playing
    if (!gameState.isPlaying) return;
    
    // Prevent default behavior for arrow keys
    if ([37, 38, 39, 40, 32].includes(event.keyCode)) {
        event.preventDefault();
    }
    
    switch (event.keyCode) {
        // Left arrow
        case 37:
            if (gameState.direction.x === 0) {
                gameState.nextDirection = { x: -1, y: 0 };
            }
            break;
        // Up arrow
        case 38:
            if (gameState.direction.y === 0) {
                gameState.nextDirection = { x: 0, y: -1 };
            }
            break;
        // Right arrow
        case 39:
            if (gameState.direction.x === 0) {
                gameState.nextDirection = { x: 1, y: 0 };
            }
            break;
        // Down arrow
        case 40:
            if (gameState.direction.y === 0) {
                gameState.nextDirection = { x: 0, y: 1 };
            }
            break;
        // Space bar (pause)
        case 32:
            togglePause();
            break;
    }
}

/**
 * Handle mobile direction button presses
 */
function handleMobileDirection(direction) {
    if (!gameState.isPlaying) return;
    
    switch (direction) {
        case 'up':
            if (gameState.direction.y === 0) {
                gameState.nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'down':
            if (gameState.direction.y === 0) {
                gameState.nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'left':
            if (gameState.direction.x === 0) {
                gameState.nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'right':
            if (gameState.direction.x === 0) {
                gameState.nextDirection = { x: 1, y: 0 };
            }
            break;
    }
}

/**
 * Set up touch swipe controls for mobile devices
 */
function setupTouchControls() {
    const gameBoard = document.getElementById('snakeGameBoard');
    if (!gameBoard) return;
    
    let touchStartX, touchStartY, touchEndX, touchEndY;
    
    gameBoard.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    gameBoard.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        const xDiff = touchStartX - touchEndX;
        const yDiff = touchStartY - touchEndY;
        
        // Determine if the swipe was horizontal or vertical
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            // Horizontal swipe
            if (xDiff > 0) {
                // Swipe left
                handleMobileDirection('left');
            } else {
                // Swipe right
                handleMobileDirection('right');
            }
        } else {
            // Vertical swipe
            if (yDiff > 0) {
                // Swipe up
                handleMobileDirection('up');
            } else {
                // Swipe down
                handleMobileDirection('down');
            }
        }
    }
}

/**
 * Start the game
 */
function startGame() {
    if (gameState.isPlaying) return;
    
    // Reset game state
    gameState.snake = [
        { x: Math.floor(config.gridSize / 2), y: Math.floor(config.gridSize / 2) }
    ];
    gameState.direction = { x: 1, y: 0 };
    gameState.nextDirection = { x: 1, y: 0 };
    gameState.score = 0;
    gameState.level = 1;
    gameState.speed = parseInt(document.querySelector('.difficulty-button.active').dataset.speed);
    
    generateFood();
    
    // Update UI
    updateScoreDisplay();
    updateLevelDisplay();
    
    // Enable game controls
    elements.startButton.disabled = true;
    elements.pauseButton.disabled = false;
    elements.pauseButton.textContent = 'Pause';
    elements.resetButton.disabled = false;
    
    // Start game loop
    gameState.isPlaying = true;
    gameState.isPaused = false;
    
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    gameState.gameLoop = setInterval(updateGame, gameState.speed);
}

/**
 * Toggle pause state
 */
function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearInterval(gameState.gameLoop);
        elements.pauseButton.textContent = 'Resume';
    } else {
        gameState.gameLoop = setInterval(updateGame, gameState.speed);
        elements.pauseButton.textContent = 'Pause';
    }
}

/**
 * Reset the game to initial state
 */
function resetGame() {
    // Stop game loop
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    
    // Reset game state
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.level = 1;
    
    // Reset UI
    elements.startButton.disabled = false;
    elements.pauseButton.disabled = true;
    elements.resetButton.disabled = true;
    
    updateScoreDisplay();
    updateLevelDisplay();
    
    // Clear canvas
    clearCanvas();
    
    // Hide post-game ad if visible
    hidePostGameAd();
    
    // Hide game over screen if visible
    hideGameOverScreen();
}

/**
 * Main game loop - update game state and render
 */
function updateGame() {
    if (gameState.isPaused) return;
    
    // Update direction from nextDirection
    gameState.direction = { ...gameState.nextDirection };
    
    // Calculate new head position
    const head = { ...gameState.snake[0] };
    head.x += gameState.direction.x;
    head.y += gameState.direction.y;
    
    // Check for collisions
    if (isCollision(head)) {
        endGame();
        return;
    }
    
    // Add new head
    gameState.snake.unshift(head);
    
    // Check if snake eats food
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // Increase score
        gameState.score += config.foodValue;
        updateScoreDisplay();
        
        // Generate new food
        generateFood();
        
        // Check for level up
        checkLevelUp();
        
        // Track longest snake
        if (gameState.snake.length > gameState.longestSnake) {
            gameState.longestSnake = gameState.snake.length;
            elements.longestSnakeDisplay.textContent = gameState.longestSnake;
            saveGameData();
            
            // Check for snake length achievements
            checkSnakeLengthAchievements();
        }
    } else {
        // Remove tail if no food was eaten
        gameState.snake.pop();
    }
    
    // Render the game
    renderGame();
}

/**
 * Check for collision with walls or self
 */
function isCollision(position) {
    // Wall collision
    if (
        position.x < 0 || 
        position.y < 0 || 
        position.x >= config.gridSize || 
        position.y >= config.gridSize
    ) {
        return true;
    }
    
    // Self collision (check if position collides with any part of snake body)
    return gameState.snake.some((segment, index) => {
        // Skip checking against the head (index 0) and also the last segment
        // (which will be removed before the next frame)
        if (index === 0 || index === gameState.snake.length - 1) return false;
        return segment.x === position.x && segment.y === position.y;
    });
}

/**
 * Generate food at a random position
 */
function generateFood() {
    // Generate a random position
    let foodPosition;
    let validPosition = false;
    
    while (!validPosition) {
        foodPosition = {
            x: Math.floor(Math.random() * config.gridSize),
            y: Math.floor(Math.random() * config.gridSize)
        };
        
        // Check if the position overlaps with any part of the snake
        validPosition = !gameState.snake.some(segment => 
            segment.x === foodPosition.x && segment.y === foodPosition.y
        );
    }
    
    gameState.food = foodPosition;
}

/**
 * Check if player has reached a level threshold
 */
function checkLevelUp() {
    const newLevel = Math.floor(gameState.score / config.levelUpScore) + 1;
    
    if (newLevel > gameState.level && newLevel <= config.maxLevel) {
        gameState.level = newLevel;
        updateLevelDisplay();
        
        // Increase game speed
        const newSpeed = Math.max(
            config.initialSpeed - (gameState.level - 1) * config.speedIncrement,
            50 // Minimum speed (maximum difficulty)
        );
        
        if (newSpeed !== gameState.speed) {
            gameState.speed = newSpeed;
            clearInterval(gameState.gameLoop);
            gameState.gameLoop = setInterval(updateGame, gameState.speed);
        }
    }
}

/**
 * End the game
 */
function endGame() {
    // Stop game loop
    clearInterval(gameState.gameLoop);
    gameState.isPlaying = false;
    
    // Update game stats
    gameState.gamesPlayed++;
    elements.gamesPlayedDisplay.textContent = gameState.gamesPlayed;
    
    // Check achievements
    gameState.achievements.firstGame = true;
    
    if (gameState.gamesPlayed >= config.achievementThresholds.gamesPlayed[0]) {
        gameState.achievements.dedicated = true;
    }
    
    if (gameState.score >= config.achievementThresholds.score[0]) {
        gameState.achievements.score100 = true;
    }
    
    if (gameState.score >= config.achievementThresholds.score[1]) {
        gameState.achievements.score500 = true;
    }
    
    // Update achievements display
    updateAchievements();
    
    // Add to high scores if eligible
    addHighScore();
    
    // Save game data
    saveGameData();
    
    // Reset UI
    elements.startButton.disabled = false;
    elements.pauseButton.disabled = true;
    elements.resetButton.disabled = false;
    
    // Show game over screen
    showGameOverScreen();
    
    // Show post-game ad
    showPostGameAd();
}

/**
 * Render the game on canvas
 */
function renderGame() {
    clearCanvas();
    drawGrid();
    drawSnake();
    drawFood();
}

/**
 * Clear the canvas
 */
function clearCanvas() {
    if (!ctx) return;
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
}

/**
 * Draw grid lines
 */
function drawGrid() {
    if (!ctx) return;
    
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 0.5;
    
    const cellSize = elements.canvas.width / config.gridSize;
    
    // Draw vertical lines
    for (let i = 1; i < config.gridSize; i++) {
        const x = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, elements.canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 1; i < config.gridSize; i++) {
        const y = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(elements.canvas.width, y);
        ctx.stroke();
    }
}

/**
 * Draw the snake
 */
function drawSnake() {
    if (!ctx) return;
    
    const cellSize = elements.canvas.width / config.gridSize;
    
    // Draw snake body
    gameState.snake.forEach((segment, index) => {
        // Different color for head vs body
        ctx.fillStyle = index === 0 ? config.colors.snake.head : config.colors.snake.body;
        
        // Draw snake segment with a small gap
        const gap = 1; // 1px gap between segments
        ctx.fillRect(
            segment.x * cellSize + gap,
            segment.y * cellSize + gap,
            cellSize - 2 * gap,
            cellSize - 2 * gap
        );
        
        // Draw eyes on the head
        if (index === 0) {
            const eyeSize = cellSize / 8;
            const eyeOffset = cellSize / 4;
            ctx.fillStyle = '#000';
            
            // Position eyes based on direction
            let eyeX1, eyeY1, eyeX2, eyeY2;
            
            switch (true) {
                // Moving right
                case gameState.direction.x === 1:
                    eyeX1 = eyeX2 = segment.x * cellSize + cellSize - eyeOffset;
                    eyeY1 = segment.y * cellSize + eyeOffset;
                    eyeY2 = segment.y * cellSize + cellSize - eyeOffset;
                    break;
                // Moving left
                case gameState.direction.x === -1:
                    eyeX1 = eyeX2 = segment.x * cellSize + eyeOffset;
                    eyeY1 = segment.y * cellSize + eyeOffset;
                    eyeY2 = segment.y * cellSize + cellSize - eyeOffset;
                    break;
                // Moving down
                case gameState.direction.y === 1:
                    eyeX1 = segment.x * cellSize + eyeOffset;
                    eyeX2 = segment.x * cellSize + cellSize - eyeOffset;
                    eyeY1 = eyeY2 = segment.y * cellSize + cellSize - eyeOffset;
                    break;
                // Moving up
                case gameState.direction.y === -1:
                    eyeX1 = segment.x * cellSize + eyeOffset;
                    eyeX2 = segment.x * cellSize + cellSize - eyeOffset;
                    eyeY1 = eyeY2 = segment.y * cellSize + eyeOffset;
                    break;
                // Default (right)
                default:
                    eyeX1 = eyeX2 = segment.x * cellSize + cellSize - eyeOffset;
                    eyeY1 = segment.y * cellSize + eyeOffset;
                    eyeY2 = segment.y * cellSize + cellSize - eyeOffset;
            }
            
            // Draw the eyes
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

/**
 * Draw the food
 */
function drawFood() {
    if (!ctx) return;
    
    const cellSize = elements.canvas.width / config.gridSize;
    const x = gameState.food.x * cellSize;
    const y = gameState.food.y * cellSize;
    
    // Draw circular food
    ctx.fillStyle = config.colors.food;
    ctx.beginPath();
    ctx.arc(
        x + cellSize / 2,
        y + cellSize / 2,
        cellSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Add a highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
        x + cellSize / 3,
        y + cellSize / 3,
        cellSize / 6,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

/**
 * Resize canvas to fit container while maintaining aspect ratio
 */
function resizeCanvas() {
    if (!elements.canvas) return;
    
    const container = elements.canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    // Set canvas size to match container width (maintain 1:1 ratio)
    elements.canvas.width = containerWidth;
    elements.canvas.height = containerWidth;
    
    // Re-render if game is in progress
    if (gameState.isPlaying) {
        renderGame();
    }
}

/**
 * Update the score display
 */
function updateScoreDisplay() {
    elements.scoreDisplay.textContent = gameState.score;
    
    // Update high score if current score is higher
    const currentHighScore = parseInt(elements.highScoreDisplay.textContent) || 0;
    if (gameState.score > currentHighScore) {
        elements.highScoreDisplay.textContent = gameState.score;
    }
}

/**
 * Update the level display
 */
function updateLevelDisplay() {
    elements.levelDisplay.textContent = gameState.level;
}

/**
 * Show the game over screen
 */
function showGameOverScreen() {
    try {
        elements.finalScoreDisplay.textContent = gameState.score;
        elements.finalHighScoreDisplay.textContent = gameState.highScores.length > 0 
            ? gameState.highScores[0].score 
            : 0;
        
        elements.gameOverScreen.style.opacity = '1';
        elements.gameOverScreen.style.pointerEvents = 'all';
        
        // Don't call handleGameOver here as it's redundant with addHighScore in endGame
    } catch (error) {
        console.error("Error in showGameOverScreen function:", error);
        // Ensure the game over screen is shown even if there's an error
        if (elements.gameOverScreen) {
            elements.gameOverScreen.style.opacity = '1';
            elements.gameOverScreen.style.pointerEvents = 'all';
        }
    }
}

/**
 * Hide the game over screen
 */
function hideGameOverScreen() {
    elements.gameOverScreen.style.opacity = '0';
    elements.gameOverScreen.style.pointerEvents = 'none';
}

/**
 * Show the post-game advertisement
 */
function showPostGameAd() {
    elements.postGameAd.classList.add('visible');
}

/**
 * Hide the post-game advertisement
 */
function hidePostGameAd() {
    elements.postGameAd.classList.remove('visible');
}

/**
 * Add current score to high scores if eligible
 */
function addHighScore() {
    if (gameState.score === 0) return;
    
    // Prompt user for name directly
    let playerName = prompt(`Game Over! Your score was ${gameState.score}! Enter your name:`, "Player");
    
    // If user cancels prompt or enters empty string
    if (playerName === null || playerName.trim() === '') {
        playerName = "Anonymous";
    }
    
    // Create new score entry
    const newScore = {
        name: playerName,
        score: gameState.score,
        date: new Date().toISOString(),
        level: gameState.level,
        snakeLength: gameState.snake.length
    };
    
    // Add to high scores and sort
    gameState.highScores.push(newScore);
    gameState.highScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 5 scores
    if (gameState.highScores.length > 5) {
        gameState.highScores = gameState.highScores.slice(0, 5);
    }
    
    // Update best score display
    if (gameState.highScores.length > 0 && elements.bestScoreDisplay) {
        elements.bestScoreDisplay.textContent = gameState.highScores[0].score;
    }
    
    // Also save to the shared localStorage high scores
    try {
        // Get existing scores
        let highScores = JSON.parse(localStorage.getItem('highScores')) || {};
        if (!highScores["Snake Game"]) {
            highScores["Snake Game"] = [];
        }
        
        // Add new score
        highScores["Snake Game"].push({
            name: playerName,
            score: gameState.score,
            date: new Date().toISOString()
        });
        
        // Sort scores (higher is better)
        highScores["Snake Game"].sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        if (highScores["Snake Game"].length > 10) {
            highScores["Snake Game"] = highScores["Snake Game"].slice(0, 10);
        }
        
        // Save back to localStorage
        localStorage.setItem('highScores', JSON.stringify(highScores));
    } catch (error) {
        console.error("Error saving to shared high scores:", error);
    }
    
    // Update high scores list
    updateHighScoresList();
}

/**
 * Update the high scores list in the UI
 */
function updateHighScoresList() {
    if (!elements.highScoresList) return;
    
    // Clear current list
    elements.highScoresList.innerHTML = '';
    
    // Add each high score to the list
    if (gameState.highScores.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No high scores yet';
        elements.highScoresList.appendChild(listItem);
    } else {
        gameState.highScores.forEach((score, index) => {
            const listItem = document.createElement('li');
            const scoreDate = new Date(score.date);
            const formattedDate = `${scoreDate.getMonth() + 1}/${scoreDate.getDate()}/${scoreDate.getFullYear()}`;
            
            // Display player name if available, otherwise just show the score
            if (score.name) {
                listItem.textContent = `${score.name}: ${score.score} points (Level ${score.level}) - ${formattedDate}`;
            } else {
                listItem.textContent = `${score.score} points (Level ${score.level}) - ${formattedDate}`;
            }
            
            elements.highScoresList.appendChild(listItem);
        });
    }
}

/**
 * Check for snake length achievements
 */
function checkSnakeLengthAchievements() {
    if (gameState.snake.length >= config.achievementThresholds.snakeLength[0]) {
        gameState.achievements.snake10 = true;
    }
    
    if (gameState.snake.length >= config.achievementThresholds.snakeLength[1]) {
        gameState.achievements.snake20 = true;
    }
}

/**
 * Update the achievements display
 */
function updateAchievements() {
    // Map of achievement IDs to their status
    const achievementMap = {
        'achievement-first-game': gameState.achievements.firstGame,
        'achievement-score-100': gameState.achievements.score100,
        'achievement-score-500': gameState.achievements.score500,
        'achievement-snake-10': gameState.achievements.snake10,
        'achievement-snake-20': gameState.achievements.snake20,
        'achievement-dedicated': gameState.achievements.dedicated
    };
    
    // Update each achievement's appearance
    Object.entries(achievementMap).forEach(([id, unlocked]) => {
        const element = document.getElementById(id);
        if (!element) return;
        
        if (unlocked) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
        } else {
            element.classList.add('locked');
            element.classList.remove('unlocked');
        }
    });
}

/**
 * Save game data to localStorage
 */
function saveGameData() {
    const gameData = {
        gamesPlayed: gameState.gamesPlayed,
        highScores: gameState.highScores,
        longestSnake: gameState.longestSnake,
        achievements: gameState.achievements
    };
    
    try {
        localStorage.setItem('snakeGameData', JSON.stringify(gameData));
    } catch (e) {
        console.error('Failed to save game data:', e);
    }
}

/**
 * Load game data from localStorage
 */
function loadGameData() {
    try {
        const savedData = localStorage.getItem('snakeGameData');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Update game state with saved data
            gameState.gamesPlayed = parsedData.gamesPlayed || 0;
            gameState.highScores = parsedData.highScores || [];
            gameState.longestSnake = parsedData.longestSnake || 0;
            gameState.achievements = parsedData.achievements || {
                firstGame: false,
                score100: false,
                score500: false,
                snake10: false,
                snake20: false,
                dedicated: false
            };
        }
        
        // Also check for high scores in the shared high scores object
        try {
            const sharedHighScores = JSON.parse(localStorage.getItem('highScores')) || {};
            if (sharedHighScores["Snake Game"] && sharedHighScores["Snake Game"].length > 0) {
                // Merge the shared high scores with the game-specific high scores
                const combinedScores = [...gameState.highScores];
                
                // Add scores from shared high scores that aren't already in our list
                sharedHighScores["Snake Game"].forEach(sharedScore => {
                    // Check if this score is already in our list
                    const isDuplicate = combinedScores.some(existingScore => 
                        existingScore.score === sharedScore.score && 
                        existingScore.date === sharedScore.date
                    );
                    
                    if (!isDuplicate) {
                        combinedScores.push(sharedScore);
                    }
                });
                
                // Sort combined scores and take the top 5
                combinedScores.sort((a, b) => b.score - a.score);
                gameState.highScores = combinedScores.slice(0, 5);
            }
        } catch (sharedHighScoresError) {
            console.error('Error loading shared high scores:', sharedHighScoresError);
            // Continue with game state initialization even if shared high scores can't be loaded
        }
        
    } catch (e) {
        console.error('Failed to load game data:', e);
        // Ensure game state is initialized with defaults
        gameState.gamesPlayed = 0;
        gameState.highScores = [];
        gameState.longestSnake = 0;
        gameState.achievements = {
            firstGame: false,
            score100: false,
            score500: false,
            snake10: false,
            snake20: false,
            dedicated: false
        };
    }
}

/**
 * Update various UI elements with loaded data
 */
function updateUI() {
    // Update stats displays
    elements.gamesPlayedDisplay.textContent = gameState.gamesPlayed;
    elements.longestSnakeDisplay.textContent = gameState.longestSnake;
    
    // Update best score display
    if (gameState.highScores.length > 0) {
        elements.bestScoreDisplay.textContent = gameState.highScores[0].score;
        elements.highScoreDisplay.textContent = gameState.highScores[0].score;
    }
    
    // Update high scores list
    updateHighScoresList();
}

/**
 * Share score on Twitter
 */
function shareOnTwitter() {
    const text = `I scored ${gameState.score} points in Snake Game on Dumbass Games! Can you beat my score? #SnakeGame #DumbassGames`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
}

/**
 * Share score on Facebook
 */
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

/**
 * Share score on WhatsApp
 */
function shareOnWhatsApp() {
    const text = `I scored ${gameState.score} points in Snake Game on Dumbass Games! Can you beat my score?`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + window.location.href)}`, '_blank');
}

/**
 * Share functionality for header buttons
 */
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnTwitter() {
    const text = `Check out this awesome Snake Game on Dumbass Games!`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
}

function shareOnWhatsApp() {
    const text = `Check out this awesome Snake Game on Dumbass Games!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + window.location.href)}`, '_blank');
}

function bookmarkPage() {
    if (window.sidebar && window.sidebar.addPanel) { // Firefox < 23
        window.sidebar.addPanel(document.title, window.location.href, '');
    } else if (window.external && ('AddFavorite' in window.external)) { // IE
        window.external.AddFavorite(window.location.href, document.title);
    } else { // Modern browsers
        alert('Press ' + (navigator.userAgent.toLowerCase().indexOf('mac') != -1 ? 'Cmd' : 'Ctrl') + '+D to bookmark this page.');
    }
}

// Initialize the game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);

// Cookie consent implementation (shared across site)
document.addEventListener('DOMContentLoaded', function() {
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptButton = document.getElementById('cookie-accept');
    const rejectButton = document.getElementById('cookie-reject');
    const settingsButton = document.getElementById('cookie-settings');
    
    // Check if user has already made a choice
    if (!localStorage.getItem('cookiePreference')) {
        cookieConsent.style.display = 'block';
    }
    
    if (acceptButton) {
        acceptButton.addEventListener('click', () => {
            localStorage.setItem('cookiePreference', 'accepted');
            cookieConsent.style.display = 'none';
            // Here you would enable all cookies and tracking
        });
    }
    
    if (rejectButton) {
        rejectButton.addEventListener('click', () => {
            localStorage.setItem('cookiePreference', 'rejected');
            cookieConsent.style.display = 'none';
            // Here you would disable non-essential cookies and tracking
        });
    }
    
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            // You would show a more detailed cookie settings panel here
            // For now, simply accept all cookies
            localStorage.setItem('cookiePreference', 'accepted');
            cookieConsent.style.display = 'none';
        });
    }
}); 
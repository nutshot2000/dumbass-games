# Adding New Games to Dumbass Games

This guide will walk you through the process of adding your own games to the Dumbass Games website. The site uses a reusable game framework that makes it easy to create new games with consistent functionality.

## Step 1: Create the Game Directory Structure

First, create a new directory for your game in the `games/` folder:

```
games/
  └── your-game-name/
      ├── index.html
      ├── style.css
      └── script.js
```

## Step 2: Create the HTML File

Copy the structure from an existing game (like Clicker or Memory) and modify it for your game. Here's a template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Game Name - Dumbass Games</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" href="../../favicon.ico" type="image/x-icon">
    <meta name="description" content="Your game description here">
    <!-- Google AdSense Script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
    </script>
    <!-- Game Framework -->
    <script src="../../games/game-framework.js"></script>
</head>
<body>
    <header>
        <div class="header-content">
            <h1>Your Game Name</h1>
            <p>Your game tagline</p>
        </div>
    </header>
    
    <nav class="main-nav">
        <div class="nav-container">
            <ul>
                <li><a href="../../index.html">Home</a></li>
                <li><a href="../../index.html#popular">Popular Games</a></li>
                <li><a href="../../index.html#new">New Games</a></li>
                <li><a href="../../index.html#about">About</a></li>
            </ul>
        </div>
    </nav>
    
    <!-- Top Banner Ad -->
    <div class="ad-container ad-banner">
        <div class="ad-placeholder">
            <p>Advertisement</p>
        </div>
    </div>
    
    <main>
        <div class="game-container" id="gameContainer">
            <!-- Game-specific content goes here -->
            <div class="game-info">
                <h2>How to Play</h2>
                <p>Instructions for your game...</p>
            </div>
            
            <!-- Game UI elements -->
            
            <!-- Game controls -->
            <div class="controls">
                <button id="startButton">Start Game</button>
                <button id="resetButton">Reset</button>
            </div>
            
            <!-- Game stats -->
            <div class="game-stats">
                <!-- Stats content -->
            </div>
            
            <!-- Share section -->
            <div class="share-section">
                <h2>Share Your Score</h2>
                <div class="share-buttons">
                    <button id="shareTwitter" class="share-button twitter">Twitter</button>
                    <button id="shareFacebook" class="share-button facebook">Facebook</button>
                    <button id="shareWhatsapp" class="share-button whatsapp">WhatsApp</button>
                </div>
            </div>
            
            <!-- Achievements section -->
            <div class="achievements-section">
                <h2>Achievements</h2>
                <div class="achievements-grid" id="achievementsGrid">
                    <!-- Achievement items go here -->
                </div>
            </div>
        </div>
        
        <!-- Sidebar -->
        <aside class="sidebar">
            <!-- Sidebar content -->
        </aside>
    </main>
    
    <!-- Bottom Banner Ad -->
    <div class="ad-container ad-banner">
        <div class="ad-placeholder">
            <p>Advertisement</p>
        </div>
    </div>
    
    <footer>
        <!-- Footer content -->
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
```

## Step 3: Create the CSS File

Copy the base styles from an existing game and customize them for your game:

```css
/* Import the main styles */
@import url('../../styles.css');

/* Add your game-specific styles here */
```

## Step 4: Create the JavaScript File

This is where you'll implement your game logic by extending the `DumbassGame` class:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Create your game class by extending DumbassGame
    class YourGame extends DumbassGame {
        constructor() {
            // Configure your game
            super({
                gameName: 'Your Game Name',
                gameDescription: 'Your game description',
                scoreElementId: 'score', // ID of the element to display the score
                highScoreStorageKey: 'yourGameHighScores' // Unique key for storing high scores
            });
            
            // Game elements
            // Get references to your game's DOM elements
            
            // Game variables
            // Initialize your game-specific variables
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize your game
            this.initializeGame();
        }
        
        /**
         * Set up event listeners
         */
        setupEventListeners() {
            // Add event listeners for your game controls
        }
        
        /**
         * Initialize your game
         */
        initializeGame() {
            // Set up your game board or initial state
        }
        
        /**
         * Start the game
         * This method is called when the player starts a new game
         */
        onGameStart() {
            super.onGameStart(); // Call the parent method
            
            // Your game start logic
        }
        
        /**
         * End the game
         * This method is called when the game ends
         */
        onGameEnd() {
            super.onGameEnd(); // Call the parent method
            
            // Your game end logic
            
            // Save the score
            this.saveScore(this.score);
            
            // Check achievements
            this.checkAchievements();
        }
        
        /**
         * Reset the game
         * This method is called when the player resets the game
         */
        resetGame() {
            super.resetGame(); // Call the parent method
            
            // Your game reset logic
        }
        
        /**
         * Load achievements
         * Define your game's achievements
         */
        loadAchievements() {
            // Define your achievements
            const achievements = {
                // Example achievement
                'first-win': {
                    id: 'achievement-first-win',
                    title: 'First Win',
                    description: 'Complete your first game',
                    unlocked: false
                },
                // Add more achievements
            };
            
            // Load saved achievements from localStorage
            const savedAchievements = JSON.parse(localStorage.getItem('yourGameAchievements')) || {};
            
            // Merge saved achievements with default achievements
            for (const key in savedAchievements) {
                if (achievements[key]) {
                    achievements[key].unlocked = savedAchievements[key].unlocked;
                }
            }
            
            return achievements;
        }
        
        /**
         * Check achievements
         * Check if the player has earned any achievements
         */
        checkAchievements() {
            // Check for achievements based on game state
            // Example:
            if (!this.achievements['first-win'].unlocked) {
                this.achievements['first-win'].unlocked = true;
                this.achievements['first-win'].isNew = true;
            }
            
            // Save achievements
            this.saveAchievements();
            
            // Update achievements display
            this.updateAchievementsDisplay();
        }
        
        /**
         * Save achievements
         * Save the player's achievements to localStorage
         */
        saveAchievements() {
            localStorage.setItem('yourGameAchievements', JSON.stringify(this.achievements));
        }
        
        /**
         * Update achievements display
         * Update the achievements display in the UI
         */
        updateAchievementsDisplay() {
            // Update the achievements display
        }
    }
    
    // Initialize your game
    const game = new YourGame();
    
    // Set up cookie consent
    setupCookieConsent();
});

/**
 * Set up cookie consent
 */
function setupCookieConsent() {
    // Cookie consent logic
}
```

## Step 5: Create a Thumbnail Image

Create a thumbnail image for your game and save it in the `images/` directory:

```
images/
  └── your-game-name.png
```

The recommended size is 300x180 pixels.

## Step 6: Update the Main Index.html

Add your game to the main `index.html` file:

1. Add it to the "Popular Games" or "Coming Soon" section
2. Update the sidebar "Other Games" list in existing games

## Step 7: Update the Sitemap.xml

Add your game to the `sitemap.xml` file:

```xml
<url>
  <loc>https://dumbassgames.xyz/games/your-game-name/index.html</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

## Step 8: Update Other Games' Sidebar

In each existing game's HTML file, update the "Other Games" section in the sidebar to include your new game.

## Game Framework Features

The `DumbassGame` class provides the following features that you can use in your game:

- **High Score Tracking**: Automatically saves and displays high scores
- **Share Functionality**: Allows players to share their scores on social media
- **Analytics Integration**: Tracks page views and game completions
- **Achievement System**: Framework for creating and tracking achievements

### Key Methods

- `startGame()`: Starts the game and initializes the timer
- `endGame()`: Ends the game and saves the score
- `resetGame()`: Resets the game state
- `saveScore(score)`: Saves a score to the high scores list
- `loadHighScores()`: Loads high scores from localStorage
- `updateHighScoresList()`: Updates the high scores display
- `setupShareButtons()`: Sets up social media share buttons
- `shareScore(platform)`: Shares the score on a specific platform
- `trackPageView()`: Tracks a page view in analytics
- `trackGameCompletion()`: Tracks a game completion in analytics

## Example: Creating a Simple Snake Game

Here's a simplified example of how you might implement a Snake game:

```javascript
class SnakeGame extends DumbassGame {
    constructor() {
        super({
            gameName: 'Snake Game',
            gameDescription: 'Eat food and grow your snake!',
            scoreElementId: 'score',
            highScoreStorageKey: 'snakeHighScores'
        });
        
        // Game elements
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game variables
        this.snake = [{x: 10, y: 10}];
        this.food = {x: 15, y: 15};
        this.direction = 'right';
        this.gameInterval = null;
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
    }
    
    handleKeyPress(e) {
        // Handle arrow key presses to change direction
    }
    
    onGameStart() {
        super.onGameStart();
        this.gameInterval = setInterval(() => this.gameLoop(), 100);
    }
    
    gameLoop() {
        // Move the snake
        // Check for collisions
        // Update the score
        // Draw the game
    }
    
    onGameEnd() {
        super.onGameEnd();
        clearInterval(this.gameInterval);
    }
}
```

## Conclusion

By following these steps, you can easily add new games to the Dumbass Games website. The game framework handles common functionality like high scores, sharing, and analytics, allowing you to focus on implementing your game's unique mechanics.

For more examples, look at the existing games in the `games/` directory. 
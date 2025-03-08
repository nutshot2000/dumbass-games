document.addEventListener('DOMContentLoaded', () => {
    // Load the game framework
    class MemoryGame extends DumbassGame {
        constructor() {
            super({
                gameName: 'Memory Game',
                gameDescription: 'Match pairs of cards to win!',
                scoreElementId: 'moves',
                highScoreStorageKey: 'memoryHighScores'
            });
            
            // Game elements
            this.memoryBoard = document.getElementById('memoryBoard');
            this.timerDisplay = document.getElementById('timer');
            this.pairsDisplay = document.getElementById('pairs');
            this.totalPairsDisplay = document.getElementById('totalPairs');
            this.startButton = document.getElementById('startButton');
            this.resetButton = document.getElementById('resetButton');
            this.gamesPlayedDisplay = document.getElementById('gamesPlayed');
            this.bestTimeDisplay = document.getElementById('bestTime');
            this.bestMovesDisplay = document.getElementById('bestMoves');
            this.difficultyButtons = document.querySelectorAll('.difficulty-button');
            this.achievementsGrid = document.getElementById('achievementsGrid');
            
            // Game variables
            this.cards = [];
            this.flippedCards = [];
            this.matchedPairs = 0;
            this.totalPairs = 8;
            this.boardSize = 4; // Default 4x4 grid
            this.timerInterval = null;
            this.seconds = 0;
            this.moves = 0;
            this.canFlip = false;
            this.completedDifficulties = new Set(JSON.parse(localStorage.getItem('memoryCompletedDifficulties')) || []);
            this.gamesPlayed = parseInt(localStorage.getItem('memoryGamesPlayed')) || 0;
            this.bestTimes = JSON.parse(localStorage.getItem('memoryBestTimes')) || { 4: Infinity, 6: Infinity, 8: Infinity };
            this.bestMoves = JSON.parse(localStorage.getItem('memoryBestMoves')) || { 4: Infinity, 6: Infinity, 8: Infinity };
            this.achievements = this.loadAchievements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Display stats
            this.updateStats();
            
            // Update achievements display
            this.updateAchievementsDisplay();
            
            // Initialize the game board
            this.initializeBoard();
        }
        
        /**
         * Set up event listeners
         */
        setupEventListeners() {
            this.startButton.addEventListener('click', () => this.startGame());
            this.resetButton.addEventListener('click', () => this.resetGame());
            
            // Difficulty buttons
            this.difficultyButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const size = parseInt(button.dataset.size);
                    this.changeDifficulty(size);
                });
            });
        }
        
        /**
         * Change difficulty level
         */
        changeDifficulty(size) {
            // Update active button
            this.difficultyButtons.forEach(button => {
                button.classList.remove('active');
                if (parseInt(button.dataset.size) === size) {
                    button.classList.add('active');
                }
            });
            
            // Update board size
            this.boardSize = size;
            this.totalPairs = Math.floor((size * size) / 2);
            this.totalPairsDisplay.textContent = this.totalPairs;
            
            // Reset and initialize the board
            this.resetGame();
            this.initializeBoard();
        }
        
        /**
         * Initialize the game board
         */
        initializeBoard() {
            // Clear the board
            this.memoryBoard.innerHTML = '';
            
            // Set grid columns based on board size
            this.memoryBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
            
            // Generate card pairs
            const emojis = this.getEmojis();
            const cardValues = [];
            
            // Create pairs of cards
            for (let i = 0; i < this.totalPairs; i++) {
                cardValues.push(emojis[i], emojis[i]);
            }
            
            // Shuffle the cards
            this.shuffleArray(cardValues);
            
            // Create card elements
            this.cards = [];
            cardValues.forEach((value, index) => {
                const card = this.createCard(value, index);
                this.memoryBoard.appendChild(card);
                this.cards.push(card);
            });
        }
        
        /**
         * Create a card element
         */
        createCard(value, index) {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.value = value;
            
            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">${value}</div>
                    <div class="memory-card-back"></div>
                </div>
            `;
            
            card.addEventListener('click', () => this.flipCard(card));
            
            return card;
        }
        
        /**
         * Flip a card
         */
        flipCard(card) {
            // Check if card can be flipped
            if (!this.canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
                return;
            }
            
            // Flip the card
            card.classList.add('flipped');
            this.flippedCards.push(card);
            
            // Check for match if two cards are flipped
            if (this.flippedCards.length === 2) {
                this.moves++;
                this.updateScore();
                this.checkForMatch();
            }
        }
        
        /**
         * Check if the two flipped cards match
         */
        checkForMatch() {
            const [card1, card2] = this.flippedCards;
            
            // Temporarily disable flipping
            this.canFlip = false;
            
            if (card1.dataset.value === card2.dataset.value) {
                // Cards match
                setTimeout(() => {
                    card1.classList.add('matched');
                    card2.classList.add('matched');
                    this.flippedCards = [];
                    this.matchedPairs++;
                    this.pairsDisplay.textContent = this.matchedPairs;
                    
                    // Check if game is complete
                    if (this.matchedPairs === this.totalPairs) {
                        this.endGame();
                    } else {
                        this.canFlip = true;
                    }
                }, 500);
            } else {
                // Cards don't match, flip them back
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    this.flippedCards = [];
                    this.canFlip = true;
                }, 1000);
            }
        }
        
        /**
         * Game-specific start logic
         */
        onGameStart() {
            // Reset game state
            this.matchedPairs = 0;
            this.moves = 0;
            this.seconds = 0;
            this.flippedCards = [];
            this.pairsDisplay.textContent = this.matchedPairs;
            this.updateScore();
            this.updateTimer();
            
            // Reset all cards
            this.cards.forEach(card => {
                card.classList.remove('flipped', 'matched');
            });
            
            // Enable card flipping
            this.canFlip = true;
            
            // Start timer
            this.timerInterval = setInterval(() => {
                this.seconds++;
                this.updateTimer();
            }, 1000);
        }
        
        /**
         * Game-specific end logic
         */
        onGameEnd() {
            super.onGameEnd();
            
            // Stop timer
            clearInterval(this.timerInterval);
            
            // Record game stats
            this.gamesPlayed++;
            localStorage.setItem('memoryGamesPlayed', this.gamesPlayed);
            
            // Update best times and moves if better
            if (this.seconds < this.bestTimes[this.boardSize] || this.bestTimes[this.boardSize] === Infinity) {
                this.bestTimes[this.boardSize] = this.seconds;
                localStorage.setItem('memoryBestTimes', JSON.stringify(this.bestTimes));
            }
            
            if (this.moves < this.bestMoves[this.boardSize] || this.bestMoves[this.boardSize] === Infinity) {
                this.bestMoves[this.boardSize] = this.moves;
                localStorage.setItem('memoryBestMoves', JSON.stringify(this.bestMoves));
            }
            
            // Track that this difficulty was completed
            this.completedDifficulties.add(this.boardSize.toString());
            localStorage.setItem('memoryCompletedDifficulties', JSON.stringify(Array.from(this.completedDifficulties)));
            
            // Update display
            this.updateStats();
            
            // Check achievements
            this.checkAchievements();
            
            // Calculate score based on time and moves
            const baseScore = 1000;
            const timeMultiplier = 0.5; // Lower time is better
            const moveMultiplier = 1.0; // Lower moves is better
            const score = Math.floor(baseScore - (this.seconds * timeMultiplier) - (this.moves * moveMultiplier));
            
            // Save score to high scores
            this.saveScore(score > 0 ? score : 1);
            
            // Show congratulatory message
            setTimeout(() => {
                alert(`Congratulations! You matched all pairs in ${this.formatTime(this.seconds)} with ${this.moves} moves!`);
            }, 500);
            
            // Show post-game ad
            const postGameAd = document.getElementById('postGameAd');
            if (postGameAd) {
                postGameAd.classList.add('visible');
                // Hide ad after 8 seconds
                setTimeout(() => {
                    postGameAd.classList.remove('visible');
                }, 8000);
            }
        }
        
        /**
         * Reset the game
         */
        resetGame() {
            super.resetGame();
            
            // Stop timer if running
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            
            // Reset game state
            this.matchedPairs = 0;
            this.moves = 0;
            this.seconds = 0;
            this.flippedCards = [];
            
            // Update UI
            this.pairsDisplay.textContent = this.matchedPairs;
            this.updateScore();
            this.updateTimer();
            
            // Reset all cards
            this.cards.forEach(card => {
                card.classList.remove('flipped', 'matched');
            });
            
            // Disable card flipping
            this.canFlip = false;
        }
        
        /**
         * Update the timer display
         */
        updateTimer() {
            this.timerDisplay.textContent = this.formatTime(this.seconds);
        }
        
        /**
         * Format seconds as mm:ss
         */
        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        /**
         * Update game statistics
         */
        updateStats() {
            this.gamesPlayedDisplay.textContent = this.gamesPlayed;
            
            // Update best time
            const bestTime = this.bestTimes[this.boardSize];
            this.bestTimeDisplay.textContent = bestTime !== Infinity ? this.formatTime(bestTime) : '--:--';
            
            // Update best moves
            const bestMoves = this.bestMoves[this.boardSize];
            this.bestMovesDisplay.textContent = bestMoves !== Infinity ? bestMoves : '--';
        }
        
        /**
         * Get emojis for card values
         */
        getEmojis() {
            const allEmojis = [
                '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
                '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
                '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
                '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
                '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎',
                '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡',
                '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅',
                '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪'
            ];
            
            // Shuffle and take the required number of emojis
            this.shuffleArray(allEmojis);
            return allEmojis.slice(0, this.totalPairs);
        }
        
        /**
         * Shuffle an array (Fisher-Yates algorithm)
         */
        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        
        /**
         * Load achievements from localStorage
         */
        loadAchievements() {
            const savedAchievements = JSON.parse(localStorage.getItem('memoryAchievements')) || {};
            
            // Define all achievements
            const achievements = {
                firstWin: {
                    id: 'achievement-first-win',
                    name: 'First Win',
                    description: 'Complete your first game',
                    unlocked: savedAchievements.firstWin ? savedAchievements.firstWin.unlocked : false,
                    isNew: false,
                    condition: function() { return this.gamesPlayed > 0; }.bind(this)
                },
                speedDemon: {
                    id: 'achievement-speed-demon',
                    name: 'Speed Demon',
                    description: 'Complete a game in under 60 seconds',
                    unlocked: savedAchievements.speedDemon ? savedAchievements.speedDemon.unlocked : false,
                    isNew: false,
                    condition: function() { 
                        return this.isRunning === false && this.seconds < 60 && this.matchedPairs === this.totalPairs; 
                    }.bind(this)
                },
                perfectMemory: {
                    id: 'achievement-perfect-memory',
                    name: 'Perfect Memory',
                    description: 'Complete with less than 30 moves',
                    unlocked: savedAchievements.perfectMemory ? savedAchievements.perfectMemory.unlocked : false,
                    isNew: false,
                    condition: function() { 
                        return this.isRunning === false && this.moves < 30 && this.matchedPairs === this.totalPairs; 
                    }.bind(this)
                },
                hardMode: {
                    id: 'achievement-hard-mode',
                    name: 'Hard Mode',
                    description: 'Complete the 8×8 grid',
                    unlocked: savedAchievements.hardMode ? savedAchievements.hardMode.unlocked : false,
                    isNew: false,
                    condition: function() { 
                        return this.boardSize === 8 && this.matchedPairs === this.totalPairs; 
                    }.bind(this)
                },
                dedicated: {
                    id: 'achievement-dedicated',
                    name: 'Dedicated',
                    description: 'Play 10+ games',
                    unlocked: savedAchievements.dedicated ? savedAchievements.dedicated.unlocked : false,
                    isNew: false,
                    condition: function() { return this.gamesPlayed >= 10; }.bind(this)
                },
                master: {
                    id: 'achievement-master',
                    name: 'Memory Master',
                    description: 'Complete all difficulties',
                    unlocked: savedAchievements.master ? savedAchievements.master.unlocked : false,
                    isNew: false,
                    condition: function() { 
                        return this.completedDifficulties.size >= 3; 
                    }.bind(this)
                }
            };
            
            return achievements;
        }
        
        /**
         * Check for newly unlocked achievements
         */
        checkAchievements() {
            const newlyUnlocked = [];
            
            // Check each achievement
            for (const key in this.achievements) {
                const achievement = this.achievements[key];
                
                // Skip already unlocked achievements
                if (achievement.unlocked) continue;
                
                // Check if condition is met
                if (achievement.condition()) {
                    achievement.unlocked = true;
                    achievement.isNew = true;
                    newlyUnlocked.push(achievement);
                }
            }
            
            // Save achievements to localStorage
            this.saveAchievements();
            
            // Update achievements display
            this.updateAchievementsDisplay();
            
            return newlyUnlocked;
        }
        
        /**
         * Save achievements to localStorage
         */
        saveAchievements() {
            localStorage.setItem('memoryAchievements', JSON.stringify(this.achievements));
        }
        
        /**
         * Update achievements display
         */
        updateAchievementsDisplay() {
            // Update each achievement element
            for (const key in this.achievements) {
                const achievement = this.achievements[key];
                const element = document.getElementById(achievement.id);
                
                if (element) {
                    // Remove all classes first
                    element.classList.remove('locked', 'unlocked', 'new');
                    
                    // Add appropriate class
                    if (achievement.unlocked) {
                        element.classList.add('unlocked');
                        
                        if (achievement.isNew) {
                            element.classList.add('new');
                            
                            // Clear "new" status after 5 seconds
                            setTimeout(() => {
                                achievement.isNew = false;
                                element.classList.remove('new');
                                this.saveAchievements();
                            }, 5000);
                        }
                    } else {
                        element.classList.add('locked');
                    }
                }
            }
        }
    }
    
    // Initialize the game
    const game = new MemoryGame();
    
    // Set up cookie consent
    setupCookieConsent();
});

// Cookie consent banner
function setupCookieConsent() {
    // Check if user has already consented
    const consentStatus = localStorage.getItem('cookieConsent');
    if (consentStatus === 'accepted' || consentStatus === 'rejected' || consentStatus === 'customized') {
        // If they rejected cookies, we should still respect their choice but not load analytics
        if (consentStatus === 'rejected') {
            // Disable analytics if implemented
        }
        // Hide the banner immediately if consent was already given
        const cookieConsent = document.getElementById('cookieConsent');
        if (cookieConsent) {
            cookieConsent.style.display = 'none';
        }
        return;
    }
    
    // Get the cookie consent element from the page
    const cookieConsent = document.getElementById('cookieConsent');
    if (!cookieConsent) return;
    
    // Make sure the banner is visible and properly positioned initially
    cookieConsent.style.transform = 'translateY(100%)';
    cookieConsent.style.display = 'block';
    
    // Show with animation after a delay
    setTimeout(() => {
        cookieConsent.style.transform = 'translateY(0)';
    }, 1000);
    
    // Function to handle consent choice
    const handleConsent = (choice) => {
        localStorage.setItem('cookieConsent', choice);
        
        if (choice === 'accepted' || choice === 'customized') {
            // Enable analytics if implemented
        } else if (choice === 'rejected') {
            // Disable analytics if implemented
        }
        
        // Hide the banner
        cookieConsent.style.transform = 'translateY(100%)';
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            cookieConsent.style.display = 'none';
        }, 500);
    };
    
    // Setup event listeners
    const acceptButton = document.getElementById('cookie-accept');
    const settingsButton = document.getElementById('cookie-settings');
    const rejectButton = document.getElementById('cookie-reject');
    
    if (acceptButton) {
        acceptButton.addEventListener('click', () => handleConsent('accepted'));
    }
    
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            // In a real implementation, this would open a modal with cookie settings
            alert('Cookie settings would be shown here with options for necessary, analytics, and advertising cookies.');
            // For demo purposes, treat it as customized consent
            handleConsent('customized');
        });
    }
    
    if (rejectButton) {
        rejectButton.addEventListener('click', () => handleConsent('rejected'));
    }
}

// Show detailed cookie settings
function showCookieSettings() {
    const settingsModal = document.createElement('div');
    settingsModal.className = 'cookie-settings-modal';
    
    const currentPreferences = JSON.parse(localStorage.getItem('cookiePreferences') || '{"necessary":true,"analytics":false,"advertising":false}');
    
    settingsModal.innerHTML = `
        <div class="cookie-settings-content">
            <h2>Cookie Settings</h2>
            <p>Manage your cookie preferences below. Necessary cookies cannot be disabled as they are required for the website to function properly.</p>
            
            <div class="cookie-option">
                <label>
                    <input type="checkbox" id="necessary-cookies" checked disabled>
                    <span>Necessary Cookies</span>
                </label>
                <p>These cookies are required for the website to function and cannot be disabled.</p>
            </div>
            
            <div class="cookie-option">
                <label>
                    <input type="checkbox" id="analytics-cookies" ${currentPreferences.analytics ? 'checked' : ''}>
                    <span>Analytics Cookies</span>
                </label>
                <p>These cookies help us understand how visitors interact with our website.</p>
            </div>
            
            <div class="cookie-option">
                <label>
                    <input type="checkbox" id="advertising-cookies" ${currentPreferences.advertising ? 'checked' : ''}>
                    <span>Advertising Cookies</span>
                </label>
                <p>These cookies are used to show you relevant advertisements on and off our website.</p>
            </div>
            
            <div class="cookie-settings-buttons">
                <button id="save-preferences">Save Preferences</button>
                <button id="accept-all">Accept All</button>
            </div>
        </div>
    `;
    
    // Add styles for the modal
    const style = document.createElement('style');
    style.textContent = `
        .cookie-settings-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1001;
        }
        
        .cookie-settings-content {
            background-color: #1e1e1e;
            border-radius: 10px;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .cookie-settings-content h2 {
            color: #4ecdc4;
            margin-bottom: 1rem;
        }
        
        .cookie-option {
            margin: 1.5rem 0;
            padding-bottom: 1rem;
            border-bottom: 1px solid #333;
        }
        
        .cookie-option label {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
            font-weight: bold;
        }
        
        .cookie-option input {
            margin-right: 0.5rem;
        }
        
        .cookie-settings-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .cookie-settings-buttons button {
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
        }
        
        #save-preferences {
            background-color: #333;
            color: white;
        }
        
        #accept-all {
            background-color: #4ecdc4;
            color: white;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(settingsModal);
    
    // Handle save preferences button
    document.getElementById('save-preferences').addEventListener('click', () => {
        const preferences = {
            necessary: true,
            analytics: document.getElementById('analytics-cookies').checked,
            advertising: document.getElementById('advertising-cookies').checked
        };
        
        localStorage.setItem('cookieConsent', 'customized');
        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        settingsModal.remove();
    });
    
    // Handle accept all button
    document.getElementById('accept-all').addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        localStorage.setItem('cookiePreferences', JSON.stringify({
            necessary: true,
            analytics: true,
            advertising: true
        }));
        settingsModal.remove();
    });
} 
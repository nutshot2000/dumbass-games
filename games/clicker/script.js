document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding tab pane
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Load the game framework
    class ClickerGame extends DumbassGame {
        constructor() {
            super({
                gameName: 'Clicker Game',
                gameDescription: 'Click as fast as you can in 10 seconds!',
                scoreElementId: 'score',
                highScoreStorageKey: 'clickerHighScores'
            });
            
            // Game elements
            this.clickArea = document.getElementById('clickArea');
            this.timerDisplay = document.getElementById('timer');
            this.startButton = document.getElementById('startButton');
            this.resetButton = document.getElementById('resetButton');
            this.gamesPlayedDisplay = document.getElementById('gamesPlayed');
            this.bestScoreDisplay = document.getElementById('bestScore');
            this.avgScoreDisplay = document.getElementById('avgScore');
            this.achievementsGrid = document.getElementById('achievementsGrid');
            
            // Game variables
            this.timeLeft = 10.0;
            this.timerInterval = null;
            this.clickHistory = [];
            this.gamesPlayed = parseInt(localStorage.getItem('clickerGamesPlayed')) || 0;
            this.totalClicks = parseInt(localStorage.getItem('clickerTotalClicks')) || 0;
            this.bestScore = Math.max(...this.highScores.map(h => h.score), 0);
            this.achievements = this.loadAchievements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Display stats
            this.updateStats();
            
            // Update achievements display
            this.updateAchievementsDisplay();
        }
        
        /**
         * Set up event listeners
         */
        setupEventListeners() {
            this.startButton.addEventListener('click', () => this.startGame());
            this.resetButton.addEventListener('click', () => this.resetGame());
            this.clickArea.addEventListener('click', (e) => this.handleClick(e));
            
            // Add keyboard support
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space' && !e.repeat) {
                    if (!this.isRunning && this.startButton.disabled === false) {
                        this.startGame();
                    } else if (this.isRunning) {
                        this.simulateClick();
                    }
                }
            });
        }
        
        /**
         * Game-specific start logic
         */
        onGameStart() {
            this.timeLeft = 10.0;
            this.clickHistory = [];
            
            // Update UI
            this.timerDisplay.textContent = this.timeLeft.toFixed(1);
            this.clickArea.style.backgroundColor = '#ff6b6b';
            this.startButton.disabled = true;
            this.resetButton.disabled = true;
            
            // Add animation to click area
            this.clickArea.classList.add('pulse');
            
            // Start timer
            this.timerInterval = setInterval(() => this.updateTimer(), 100);
        }
        
        /**
         * Update the timer
         */
        updateTimer() {
            this.timeLeft -= 0.1;
            this.timerDisplay.textContent = this.timeLeft.toFixed(1);
            
            // Change color as time runs out
            if (this.timeLeft <= 3.0) {
                const redValue = Math.floor(107 + (148 - 107) * (1 - this.timeLeft / 3.0));
                this.clickArea.style.backgroundColor = `rgb(255, ${redValue}, ${redValue})`;
            }
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }
        
        /**
         * Handle click on the click area
         */
        handleClick(e) {
            if (!this.isRunning) {
                // If game is not running, start it on click
                if (this.startButton.disabled === false) {
                    this.startGame();
                }
                return;
            }
            
            // Increment score
            this.score++;
            this.updateScore();
            
            // Record click time for analytics
            this.clickHistory.push({
                time: 10.0 - this.timeLeft,
                x: e.clientX,
                y: e.clientY
            });
            
            // Visual feedback
            this.createClickEffect(e);
            
            // Haptic feedback (vibration) if available
            if (navigator.vibrate) {
                navigator.vibrate(5);
            }
        }
        
        /**
         * Simulate a click (for keyboard support)
         */
        simulateClick() {
            if (!this.isRunning) return;
            
            // Increment score
            this.score++;
            this.updateScore();
            
            // Record click time for analytics
            this.clickHistory.push({
                time: 10.0 - this.timeLeft,
                x: this.clickArea.offsetWidth / 2,
                y: this.clickArea.offsetHeight / 2
            });
            
            // Visual feedback
            const rect = this.clickArea.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Create a fake event object
            const fakeEvent = {
                clientX: rect.left + centerX,
                clientY: rect.top + centerY
            };
            
            this.createClickEffect(fakeEvent);
        }
        
        /**
         * Create click effect
         */
        createClickEffect(e) {
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';
            
            // Position the ripple at click location
            const rect = this.clickArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Add ripple to click area
            this.clickArea.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 500);
            
            // Add styles for the ripple if not already added
            if (!document.getElementById('ripple-style')) {
                const style = document.createElement('style');
                style.id = 'ripple-style';
                style.textContent = `
                    .click-ripple {
                        position: absolute;
                        width: 10px;
                        height: 10px;
                        background-color: rgba(255, 255, 255, 0.7);
                        border-radius: 50%;
                        transform: scale(0);
                        animation: ripple 0.5s linear;
                        pointer-events: none;
                    }
                    
                    @keyframes ripple {
                        to {
                            transform: scale(20);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        /**
         * Game-specific end logic
         */
        onGameEnd() {
            super.onGameEnd();
            
            // Stop timer
            clearInterval(this.timerInterval);
            
            // Update UI
            this.clickArea.style.backgroundColor = '#666';
            this.clickArea.classList.remove('pulse');
            this.resetButton.disabled = false;
            
            // Record the score
            this.gamesPlayed++;
            localStorage.setItem('clickerGamesPlayed', this.gamesPlayed);
            this.totalClicks += this.score;
            localStorage.setItem('clickerTotalClicks', this.totalClicks);
            
            // Update stats display
            this.updateStats();
            
            // Generate insights
            this.generateInsights();
            
            // Check achievements
            this.checkAchievements();
            
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
         * Generate insights based on click history
         */
        generateInsights() {
            const insights = [];
            
            if (this.clickHistory.length === 0) return insights;
            
            // Calculate clicks per second
            const clicksPerSecond = this.score / 10;
            insights.push(`Average speed: ${clicksPerSecond.toFixed(1)} clicks per second`);
            
            // Find fastest clicking period
            const clickIntervals = [];
            for (let i = 1; i < this.clickHistory.length; i++) {
                clickIntervals.push(this.clickHistory[i].time - this.clickHistory[i-1].time);
            }
            
            if (clickIntervals.length > 0) {
                const fastestInterval = Math.min(...clickIntervals);
                const fastestClicksPerSecond = 1 / fastestInterval;
                
                if (fastestClicksPerSecond > 10) {
                    insights.push(`Peak speed: ${fastestClicksPerSecond.toFixed(1)} clicks per second`);
                }
            }
            
            // Check for slowdown
            if (this.clickHistory.length >= 10) {
                const firstHalf = this.clickHistory.slice(0, Math.floor(this.clickHistory.length / 2));
                const secondHalf = this.clickHistory.slice(Math.floor(this.clickHistory.length / 2));
                
                const firstHalfClicks = firstHalf.length;
                const secondHalfClicks = secondHalf.length;
                
                if (firstHalfClicks > secondHalfClicks * 1.5) {
                    insights.push('You slowed down significantly in the second half');
                } else if (secondHalfClicks > firstHalfClicks * 1.5) {
                    insights.push('You picked up speed in the second half - nice!');
                }
            }
            
            return insights;
        }
        
        /**
         * Reset the game
         */
        resetGame() {
            super.resetGame();
            
            this.timeLeft = 10.0;
            this.timerDisplay.textContent = this.timeLeft.toFixed(1);
            this.clickArea.style.backgroundColor = '#ff6b6b';
            this.startButton.disabled = false;
        }
        
        /**
         * Update game statistics
         */
        updateStats() {
            this.gamesPlayedDisplay.textContent = this.gamesPlayed;
            
            // Update best score
            this.bestScore = this.highScores.length > 0 ? this.highScores[0].score : 0;
            this.bestScoreDisplay.textContent = this.bestScore;
            
            // Calculate average score
            const avgScore = this.gamesPlayed > 0 ? Math.round(this.totalClicks / this.gamesPlayed) : 0;
            this.avgScoreDisplay.textContent = avgScore;
        }
        
        /**
         * Load achievements from localStorage
         */
        loadAchievements() {
            const savedAchievements = JSON.parse(localStorage.getItem('clickerAchievements')) || {};
            
            // Define all achievements
            const achievements = {
                beginner: {
                    id: 'achievement-beginner',
                    name: 'Beginner',
                    description: 'Score 20+ clicks',
                    unlocked: savedAchievements.beginner ? savedAchievements.beginner.unlocked : false,
                    isNew: false,
                    condition: function() { return this.score >= 20; }.bind(this)
                },
                intermediate: {
                    id: 'achievement-intermediate',
                    name: 'Intermediate',
                    description: 'Score 40+ clicks',
                    unlocked: savedAchievements.intermediate ? savedAchievements.intermediate.unlocked : false,
                    isNew: false,
                    condition: function() { return this.score >= 40; }.bind(this)
                },
                advanced: {
                    id: 'achievement-advanced',
                    name: 'Advanced',
                    description: 'Score 60+ clicks',
                    unlocked: savedAchievements.advanced ? savedAchievements.advanced.unlocked : false,
                    isNew: false,
                    condition: function() { return this.score >= 60; }.bind(this)
                },
                pro: {
                    id: 'achievement-pro',
                    name: 'Professional',
                    description: 'Score 80+ clicks',
                    unlocked: savedAchievements.pro ? savedAchievements.pro.unlocked : false,
                    isNew: false,
                    condition: function() { return this.score >= 80; }.bind(this)
                },
                master: {
                    id: 'achievement-master',
                    name: 'Master Clicker',
                    description: 'Score 100+ clicks',
                    unlocked: savedAchievements.master ? savedAchievements.master.unlocked : false,
                    isNew: false,
                    condition: function() { return this.score >= 100; }.bind(this)
                },
                dedicated: {
                    id: 'achievement-dedicated',
                    name: 'Dedicated',
                    description: 'Play 10+ games',
                    unlocked: savedAchievements.dedicated ? savedAchievements.dedicated.unlocked : false,
                    isNew: false,
                    condition: function() { return this.gamesPlayed >= 10; }.bind(this)
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
            localStorage.setItem('clickerAchievements', JSON.stringify(this.achievements));
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
    const game = new ClickerGame();
    
    // Set up cookie consent
    setupCookieConsent();
});

// Cookie consent banner
function setupCookieConsent() {
    // Check if user has already consented
    if (!localStorage.getItem('cookieConsent')) {
        // Create cookie consent banner
        const consentBanner = document.createElement('div');
        consentBanner.className = 'cookie-consent';
        consentBanner.innerHTML = `
            <div class="cookie-text">
                <p>This website uses cookies to ensure you get the best experience on our website and to show personalized ads. 
                By continuing to use this site, you consent to our use of cookies. <a href="../../cookies.html">Learn more</a></p>
            </div>
            <div class="cookie-buttons">
                <button id="cookie-accept">Accept All</button>
                <button id="cookie-settings">Cookie Settings</button>
            </div>
        `;
        
        document.body.appendChild(consentBanner);
        
        // Handle accept button
        document.getElementById('cookie-accept').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            localStorage.setItem('cookiePreferences', JSON.stringify({
                necessary: true,
                analytics: true,
                advertising: true
            }));
            consentBanner.remove();
        });
        
        // Handle settings button
        document.getElementById('cookie-settings').addEventListener('click', () => {
            showCookieSettings();
            consentBanner.remove();
        });
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
        
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }
        
        .pulse {
            animation: pulse 1s infinite;
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
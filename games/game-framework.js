/**
 * Dumbass Games - Game Framework
 * A simple framework for creating games with consistent functionality
 */

class DumbassGame {
    constructor(options = {}) {
        // Default options
        this.options = Object.assign({
            gameName: 'Unnamed Game',
            gameDescription: 'No description provided',
            gameContainer: document.getElementById('gameContainer'),
            scoreElementId: 'score',
            highScoreStorageKey: 'highScores',
            maxHighScores: 5,
            analyticsEnabled: true,
            shareEnabled: true
        }, options);

        // Game state
        this.score = 0;
        this.isRunning = false;
        this.gameStartTime = 0;
        this.gameEndTime = 0;
        this.highScores = this.loadHighScores();
        
        // Initialize game
        this.init();
    }

    /**
     * Initialize the game
     */
    init() {
        // Load high scores
        this.updateHighScoresList();
        
        // Track page view
        if (this.options.analyticsEnabled) {
            this.trackPageView();
        }
        
        // Set up share buttons if enabled
        if (this.options.shareEnabled) {
            this.setupShareButtons();
        }
        
        console.log(`${this.options.gameName} initialized`);
    }

    /**
     * Start the game
     */
    startGame() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.score = 0;
        this.gameStartTime = Date.now();
        
        // Update UI
        this.updateScore();
        
        console.log(`${this.options.gameName} started`);
        
        // Game-specific start logic should be implemented in the child class
        this.onGameStart();
    }

    /**
     * End the game
     */
    endGame() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.gameEndTime = Date.now();
        
        // Save score
        this.saveScore(this.score);
        
        // Track game completion
        if (this.options.analyticsEnabled) {
            this.trackGameCompletion();
        }
        
        console.log(`${this.options.gameName} ended. Score: ${this.score}`);
        
        // Game-specific end logic should be implemented in the child class
        this.onGameEnd();
    }

    /**
     * Update the score display
     */
    updateScore() {
        const scoreElement = document.getElementById(this.options.scoreElementId);
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }

    /**
     * Save a score to the high scores list
     */
    saveScore(newScore) {
        // Add new score
        this.highScores.push({
            score: newScore,
            date: new Date().toISOString(),
            duration: this.gameEndTime - this.gameStartTime
        });
        
        // Sort scores in descending order
        this.highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top scores
        this.highScores = this.highScores.slice(0, this.options.maxHighScores);
        
        // Save to localStorage
        localStorage.setItem(this.options.highScoreStorageKey, JSON.stringify(this.highScores));
        
        // Update displayed list
        this.updateHighScoresList();
    }

    /**
     * Load high scores from localStorage
     */
    loadHighScores() {
        return JSON.parse(localStorage.getItem(this.options.highScoreStorageKey)) || [];
    }

    /**
     * Update the high scores list in the UI
     */
    updateHighScoresList() {
        const highScoresList = document.getElementById('highScoresList');
        if (!highScoresList) return;
        
        // Clear current list
        highScoresList.innerHTML = '';
        
        // Add each score as a list item
        this.highScores.forEach(scoreData => {
            const li = document.createElement('li');
            const date = new Date(scoreData.date);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            li.textContent = `${scoreData.score} (${formattedDate})`;
            highScoresList.appendChild(li);
        });
        
        // Add placeholder items if less than max scores
        for (let i = this.highScores.length; i < this.options.maxHighScores; i++) {
            const li = document.createElement('li');
            li.textContent = '---';
            li.style.opacity = '0.5';
            highScoresList.appendChild(li);
        }
    }

    /**
     * Set up share buttons
     */
    setupShareButtons() {
        const shareTwitter = document.getElementById('shareTwitter');
        const shareFacebook = document.getElementById('shareFacebook');
        const shareWhatsapp = document.getElementById('shareWhatsapp');
        
        if (shareTwitter) {
            shareTwitter.addEventListener('click', () => this.shareScore('twitter'));
        }
        
        if (shareFacebook) {
            shareFacebook.addEventListener('click', () => this.shareScore('facebook'));
        }
        
        if (shareWhatsapp) {
            shareWhatsapp.addEventListener('click', () => this.shareScore('whatsapp'));
        }
    }

    /**
     * Share score on social media
     */
    shareScore(platform) {
        const gameUrl = window.location.href;
        const shareText = `I just scored ${this.score} in ${this.options.gameName} at Dumbass Games! Can you beat my score?`;
        let shareUrl = '';
        
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + gameUrl)}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank');
        }
    }

    /**
     * Track page view (analytics)
     */
    trackPageView() {
        const page = window.location.pathname;
        const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
        
        if (!pageViews[page]) {
            pageViews[page] = 0;
        }
        
        pageViews[page]++;
        localStorage.setItem('pageViews', JSON.stringify(pageViews));
        
        // If Google Analytics is available, track there too
        if (typeof gtag === 'function') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: page
            });
        }
        
        console.log(`Page view tracked: ${page} (${pageViews[page]} views)`);
    }

    /**
     * Track game completion (analytics)
     */
    trackGameCompletion() {
        // If Google Analytics is available, track there
        if (typeof gtag === 'function') {
            gtag('event', 'game_completion', {
                event_category: 'game',
                event_label: this.options.gameName,
                value: this.score
            });
        }
        
        console.log(`Game completion tracked: ${this.options.gameName}, Score: ${this.score}`);
    }

    /**
     * Game-specific start logic (to be overridden)
     */
    onGameStart() {
        // Override in child class
    }

    /**
     * Game-specific end logic (to be overridden)
     */
    onGameEnd() {
        // Override in child class
    }

    /**
     * Game-specific reset logic (to be overridden)
     */
    resetGame() {
        this.score = 0;
        this.updateScore();
        
        // Override in child class for additional reset logic
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DumbassGame;
} 
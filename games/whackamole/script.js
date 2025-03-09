/**
 * Whack-a-Mole Game - Main JavaScript
 * For Dumbass Games (dumbassgames.xyz)
 */

// Audio files
const audio = {
    whack: new Audio(),
    miss: new Audio(),
    golden: new Audio(),
    bomb: new Audio(),
    rainbow: new Audio(),
    gameStart: new Audio(),
    gameOver: new Audio(),
    countdown: new Audio(),
    combo: new Audio(),
    muted: false,
    loaded: {
        whack: false,
        miss: false,
        golden: false,
        bomb: false,
        rainbow: false,
        gameStart: false,
        gameOver: false,
        countdown: false,
        combo: false
    }
};

// Set audio sources with error handling
function loadAudio() {
    try {
        audio.whack.src = '../../sounds/whack.mp3';
        audio.miss.src = '../../sounds/miss.mp3';
        audio.golden.src = '../../sounds/golden.mp3';
        audio.bomb.src = '../../sounds/bomb.mp3';
        audio.rainbow.src = '../../sounds/rainbow.mp3';
        audio.gameStart.src = '../../sounds/game-start.mp3';
        audio.gameOver.src = '../../sounds/game-over.mp3';
        audio.countdown.src = '../../sounds/countdown.mp3';
        audio.combo.src = '../../sounds/combo.mp3';
        
        // Add load event listeners
        Object.keys(audio.loaded).forEach(key => {
            audio[key].addEventListener('canplaythrough', () => {
                audio.loaded[key] = true;
            });
            
            audio[key].addEventListener('error', () => {
                console.warn(`Failed to load audio: ${key}`);
                audio.loaded[key] = false;
            });
        });
    } catch (e) {
        console.warn('Audio loading failed:', e);
    }
}

// Game configuration
const config = {
    initialGameTime: 30,      // Game duration in seconds
    minMoleTime: 500,         // Minimum time mole stays up (ms)
    maxMoleTime: 1500,        // Maximum time mole stays up (ms)
    minMoleInterval: 500,     // Minimum interval between moles (ms)
    maxMoleInterval: 1200,    // Maximum interval between moles (ms)
    speedupFactor: 0.95,      // How much to decrease times as game progresses
    maxPoints: 10,            // Maximum points per mole
    minPoints: 1,             // Minimum points per mole
    pointsDecayRate: 100,     // How quickly points decrease over time (ms)
    whackAnimationTime: 300,  // How long the whack animation lasts (ms)
    achievementThresholds: {
        score: [50, 100, 200],
        fastestWhack: 500,    // 500ms for lightning reflexes
        gamesPlayed: [10]
    },
    storageKey: 'whackamoleGameData',
    comboTimeWindow: 1500,    // Time window for combos (ms)
    maxCombo: 10,             // Maximum combo multiplier
    moleTypes: {
        normal: {
            chance: 70,       // 70% chance of normal mole
            points: 10,       // Base points
            timeUp: 1,        // Time multiplier (normal = 1x)
            className: '',
            color: ''         // Default mole color
        },
        golden: {
            chance: 10,       // 10% chance of golden mole
            points: 25,       // Worth more points
            timeUp: 0.7,      // Stays up for less time
            className: 'golden',
            color: '#FFD700'  // Gold color
        },
        bomb: {
            chance: 15,       // 15% chance of bomb mole
            points: -15,      // Negative points for hitting bombs
            timeUp: 1.2,      // Stays up a bit longer
            className: 'bomb',
            color: '#222'     // Black color for bomb
        },
        rainbow: {
            chance: 5,        // 5% chance of rainbow mole
            points: 40,       // Worth lots of points
            timeUp: 0.5,      // Very quick
            className: 'rainbow',
            color: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)'
        }
    },
    // New: Power-up configuration
    powerUps: {
        timeSlow: {
            name: "Time Slow",
            icon: "⏱️",
            duration: 10000,  // 10 seconds
            chance: 10,       // 10% chance when whacking a golden mole
            effect: "Slows down moles by 50%"
        },
        doublePoints: {
            name: "Double Points",
            icon: "✨",
            duration: 8000,   // 8 seconds
            chance: 15,       // 15% chance when whacking a rainbow mole
            effect: "Doubles all points earned"
        },
        hammerFrenzy: {
            name: "Hammer Frenzy",
            icon: "🔨",
            duration: 5000,   // 5 seconds
            chance: 10,       // 10% chance at random
            effect: "Automatically whacks moles for you"
        }
    },
    // New: Difficulty levels
    difficultyLevels: [
        { score: 0, name: "Easy", speedFactor: 1, moleFrequency: 1 },
        { score: 50, name: "Medium", speedFactor: 0.8, moleFrequency: 1.2 },
        { score: 100, name: "Hard", speedFactor: 0.6, moleFrequency: 1.5 },
        { score: 200, name: "Expert", speedFactor: 0.4, moleFrequency: 1.8 },
        { score: 300, name: "Impossible", speedFactor: 0.3, moleFrequency: 2 }
    ],
    // Sound settings
    soundVolume: 0.5
};

// Game state
const gameState = {
    score: 0,
    time: config.initialGameTime,
    isPlaying: false,
    isPaused: false,
    gameTimer: null,
    activeMole: null,
    moleTimer: null,
    nextMoleTimer: null,
    currentMoleTime: 0,
    currentMoleStart: 0,
    currentMoleType: 'normal',
    difficulty: 1,
    difficultyLevel: 0,  // Index in the difficultyLevels array
    gamesPlayed: 0,
    highScores: [],
    fastestWhack: Infinity,
    combo: 0,
    lastWhackTime: 0,
    comboMultiplier: 1,
    activePowerUps: {},  // Store active power-ups
    currentTheme: 'default',
    particles: [],       // Store active particles
    achievements: {
        firstGame: false,
        score50: false,
        score100: false,
        score200: false,
        quickWhack: false,
        dedicated: false
    },
    moleHiding: false,
    activeMoleElement: null
};

// DOM Elements
const elements = {
    holes: Array.from(document.querySelectorAll('.hole')),
    moles: Array.from(document.querySelectorAll('.mole')),
    scoreDisplay: document.getElementById('score'),
    timeDisplay: document.getElementById('time'),
    highScoreDisplay: document.getElementById('highScore'),
    startButton: document.getElementById('startButton'),
    resetButton: document.getElementById('resetButton'),
    restartButton: document.getElementById('restartButton'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    finalScoreDisplay: document.getElementById('finalScore'),
    finalHighScoreDisplay: document.getElementById('finalHighScore'),
    gamesPlayedDisplay: document.getElementById('gamesPlayed'),
    bestScoreDisplay: document.getElementById('bestScore'),
    fastestWhackDisplay: document.getElementById('fastestWhack'),
    highScoresList: document.getElementById('highScoresList'),
    achievementsGrid: document.getElementById('achievementsGrid'),
    postGameAd: document.getElementById('postGameAd'),
    shareTwitterButton: document.getElementById('shareTwitter'),
    shareFacebookButton: document.getElementById('shareFacebook'),
    shareWhatsAppButton: document.getElementById('shareWhatsApp'),
    closeAdButton: document.getElementById('closeAd'),
    comboDisplay: document.createElement('div'), // Will add to DOM later
    soundToggle: document.createElement('button'), // Will add to DOM later
    // Theme selector
    themeSelector: document.createElement('div'),
    // Power-up display
    powerUpDisplay: document.createElement('div'),
    // Difficulty indicator
    difficultyIndicator: document.createElement('div'),
    // Particles container
    particlesContainer: document.createElement('div')
};

/**
 * Initialize the game
 */
function initGame() {
    try {
        // Load audio files
        loadAudio();
        
        // Set up event listeners
        setupEventListeners();
        
        // Create UI elements
        setupComboDisplay();
        setupSoundToggle();
        setupThemeSelector();
        setupPowerUpDisplay();
        setupDifficultyIndicator();
        setupParticlesContainer();
        
        // Set audio volumes
        setupAudio();
        
        // Load saved game data from localStorage
        loadGameData();
        
        // Update UI with initial data
        updateUI();
        
        // Set up achievements
        updateAchievements();
        
        // Apply saved theme
        applyTheme(gameState.currentTheme || 'default');
    } catch (error) {
        console.error("Error initializing game:", error);
        // Try to recover by at least setting up the basic event listeners
        try {
            setupEventListeners();
        } catch (fallbackError) {
            console.error("Critical initialization failure:", fallbackError);
            // Display a message to the user if everything fails
            alert("There was an error loading the game. Please refresh the page or try again later.");
        }
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    elements.startButton.addEventListener('click', startGame);
    elements.resetButton.addEventListener('click', resetGame);
    elements.restartButton.addEventListener('click', () => {
        hideGameOverScreen();
        resetGame();
        startGame();
    });
    
    // Set up mole click listeners with improved event handling
    elements.holes.forEach((hole, index) => {
        const mole = hole.querySelector('.mole');
        // Use mousedown instead of click for faster response
        mole.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent default to avoid double events
            whackMole(index);
        });
        
        // Add touch events for mobile
        mole.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            whackMole(index);
        }, { passive: false });
        
        // Make the hole itself also clickable as a backup
        hole.addEventListener('mousedown', (e) => {
            if (elements.moles[index].classList.contains('active')) {
                e.preventDefault();
                whackMole(index);
            }
        });
        
        hole.addEventListener('touchstart', (e) => {
            if (elements.moles[index].classList.contains('active')) {
                e.preventDefault();
                whackMole(index);
            }
        }, { passive: false });
    });
    
    // Set up sharing buttons
    elements.shareTwitterButton.addEventListener('click', shareOnTwitter);
    elements.shareFacebookButton.addEventListener('click', shareOnFacebook);
    elements.shareWhatsAppButton.addEventListener('click', shareOnWhatsApp);
    
    // Set up post-game ad close button
    elements.closeAdButton.addEventListener('click', hidePostGameAd);
    
    // Cookie consent implementation (shared across site)
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptButton = document.getElementById('cookie-accept');
    const rejectButton = document.getElementById('cookie-reject');
    const settingsButton = document.getElementById('cookie-settings');
    
    // Check if we're in development mode (localhost)
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '::1';
    
    // Skip cookie consent in development mode
    if (isDevelopment) {
        if (cookieConsent) cookieConsent.style.display = 'none';
    } else {
        // Check if user has already made a cookie choice
        const cookieChoice = localStorage.getItem('cookieChoice');
        
        if (!cookieChoice) {
            // Show cookie consent if no choice made yet
            setTimeout(() => {
                cookieConsent.classList.add('visible');
            }, 1000);
        }
    }
    
    if (acceptButton) {
        acceptButton.addEventListener('click', () => {
            localStorage.setItem('cookieChoice', 'accepted');
            cookieConsent.classList.remove('visible');
        });
    }
    
    if (rejectButton) {
        rejectButton.addEventListener('click', () => {
            localStorage.setItem('cookieChoice', 'rejected');
            cookieConsent.classList.remove('visible');
        });
    }
    
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            // Redirect to cookie settings page
            window.location.href = '../../cookies.html';
        });
    }
}

/**
 * Set up combo display
 */
function setupComboDisplay() {
    // Create combo display
    elements.comboDisplay.className = 'combo-display';
    elements.comboDisplay.style.display = 'none';
    document.querySelector('.game-board').appendChild(elements.comboDisplay);
}

/**
 * Set up sound toggle button
 */
function setupSoundToggle() {
    const gameHeader = document.querySelector('.game-header');
    gameHeader.appendChild(elements.soundToggle);
    
    elements.soundToggle.addEventListener('click', toggleSound);
}

/**
 * Toggle sound on/off
 */
function toggleSound() {
    audio.muted = !audio.muted;
    elements.soundToggle.innerHTML = audio.muted ? '<span>🔇</span>' : '<span>🔊</span>';
    
    // Save sound preference
    localStorage.setItem('whackamoleSoundMuted', audio.muted);
}

/**
 * Setup audio volumes
 */
function setupAudio() {
    // Set all audio volumes
    Object.values(audio).forEach(sound => {
        if (sound instanceof Audio) {
            sound.volume = config.soundVolume;
        }
    });
    
    // Load sound preference
    const savedMuted = localStorage.getItem('whackamoleSoundMuted');
    if (savedMuted !== null) {
        audio.muted = savedMuted === 'true';
        elements.soundToggle.innerHTML = audio.muted ? '<span>🔇</span>' : '<span>🔊</span>';
    }
}

/**
 * Play a sound
 */
function playSound(sound) {
    if (audio.muted) return;
    
    try {
        // Check if sound loaded successfully
        const soundName = Object.keys(audio).find(key => audio[key] === sound);
        if (soundName && !audio.loaded[soundName]) return;
        
        // Clone the audio to allow overlapping sounds
        const soundClone = sound.cloneNode();
        soundClone.volume = config.soundVolume;
        
        // Play with error handling
        const playPromise = soundClone.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Sound playback failed:', error);
            });
        }
        
        // Clean up after playing
        soundClone.addEventListener('ended', () => {
            soundClone.remove();
        });
    } catch (e) {
        console.warn('Sound playback error:', e);
    }
}

/**
 * Start the game
 */
function startGame() {
    // Don't start if already playing
    if (gameState.isPlaying) return;
    
    // Play game start sound
    playSound(audio.gameStart);
    
    // Reset game state
    gameState.score = 0;
    gameState.time = config.initialGameTime;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.difficulty = 1;
    gameState.difficultyLevel = 0;
    gameState.combo = 0;
    gameState.comboMultiplier = 1;
    gameState.lastWhackTime = 0;
    gameState.activePowerUps = {};
    
    // Update UI
    elements.scoreDisplay.textContent = gameState.score;
    elements.timeDisplay.textContent = gameState.time;
    elements.comboDisplay.style.display = 'none';
    elements.powerUpDisplay.style.display = 'none';
    
    // Update difficulty indicator
    updateDifficultyIndicator();
    
    // Disable start button, enable reset button
    elements.startButton.disabled = true;
    elements.resetButton.disabled = false;
    
    // Add countdown before starting
    let countdown = 3;
    const countdownDisplay = document.createElement('div');
    countdownDisplay.className = 'countdown-display';
    countdownDisplay.textContent = countdown;
    document.querySelector('.game-board').appendChild(countdownDisplay);
    
    // Play countdown sound
    playSound(audio.countdown);
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownDisplay.textContent = countdown;
            playSound(audio.countdown);
        } else {
            clearInterval(countdownInterval);
            countdownDisplay.textContent = 'GO!';
            playSound(audio.countdown);
            
            setTimeout(() => {
                document.querySelector('.game-board').removeChild(countdownDisplay);
                
                // Start game loop
                gameState.gameTimer = setInterval(updateGameTime, 1000);
                
                // Start spawning moles
                spawnMole();
            }, 800);
        }
    }, 800);
}

/**
 * Update game timer
 */
function updateGameTime() {
    gameState.time--;
    elements.timeDisplay.textContent = gameState.time;
    
    // Update power-up display
    updatePowerUpDisplay();
    
    // End game when time runs out
    if (gameState.time <= 0) {
        endGame();
    }
}

/**
 * Spawn a mole in a random hole
 */
function spawnMole() {
    // Clear any existing mole timers
    if (gameState.moleTimer) {
        clearTimeout(gameState.moleTimer);
    }
    
    if (gameState.nextMoleTimer) {
        clearTimeout(gameState.nextMoleTimer);
    }
    
    // Don't spawn if not playing
    if (!gameState.isPlaying) return;
    
    // Choose a random hole
    let holeIndex;
    
    // Don't choose the same hole twice in a row
    do {
        holeIndex = Math.floor(Math.random() * elements.holes.length);
    } while (holeIndex === gameState.activeMole);
    
    gameState.activeMole = holeIndex;
    
    // Determine mole type based on probabilities
    const moleTypeRoll = Math.random() * 100;
    let cumulativeChance = 0;
    let selectedType = 'normal';
    
    for (const type in config.moleTypes) {
        cumulativeChance += config.moleTypes[type].chance;
        if (moleTypeRoll < cumulativeChance) {
            selectedType = type;
            break;
        }
    }
    
    gameState.currentMoleType = selectedType;
    const moleType = config.moleTypes[selectedType];
    
    // Apply mole styling
    const mole = elements.moles[holeIndex];
    mole.className = 'mole'; // Reset classes
    if (moleType.className) {
        mole.classList.add(moleType.className);
    }
    
    // Apply color styling
    if (moleType.color) {
        if (moleType.color.startsWith('linear-gradient')) {
            mole.style.background = moleType.color;
        } else {
            mole.style.backgroundColor = moleType.color;
        }
    } else {
        mole.style.backgroundColor = ''; // Reset to default
        mole.style.background = ''; // Reset any gradients
    }
    
    // Add a symbol for bomb moles
    if (selectedType === 'bomb') {
        const bombSymbol = document.createElement('div');
        bombSymbol.className = 'bomb-symbol';
        bombSymbol.textContent = '💣';
        mole.innerHTML = '';
        mole.appendChild(bombSymbol);
    } else {
        mole.innerHTML = '';
    }
    
    // Calculate mole times taking into account power-ups
    let moleTimeMultiplier = 1;
    let intervalMultiplier = 1;
    
    // Apply time slow power-up if active
    if (gameState.activePowerUps.timeSlow) {
        moleTimeMultiplier = 1.5; // 50% longer time up
        intervalMultiplier = 1.2; // 20% longer intervals
    }
    
    // Calculate mole time with the current difficulty level
    const difficultyLevel = config.difficultyLevels[gameState.difficultyLevel];
    const speedFactor = difficultyLevel.speedFactor;
    const moleFrequency = difficultyLevel.moleFrequency;
    
    const baseTime = Math.max(
        config.minMoleTime, 
        Math.floor((config.maxMoleTime - config.minMoleTime) * speedFactor)
    );
    
    const moleTime = Math.floor(baseTime * moleType.timeUp * moleTimeMultiplier);
    
    gameState.currentMoleTime = moleTime;
    gameState.currentMoleStart = Date.now();
    
    // Make the mole appear
    mole.classList.add('active');
    
    // Store the actual DOM element for quicker access
    gameState.activeMoleElement = mole;
    
    // Set timer to hide the mole
    gameState.moleTimer = setTimeout(() => {
        // Add a flag to track when the mole is in the process of hiding
        // This gives a small grace period for clicks to register
        gameState.moleHiding = true;
        mole.classList.remove('active');
        
        // Allow a small grace period (100ms) where whacks can still register
        setTimeout(() => {
            gameState.activeMole = null;
            gameState.moleHiding = false;
            gameState.activeMoleElement = null;
            mole.style.backgroundColor = ''; // Reset styling
            mole.style.background = '';
            mole.innerHTML = '';
        }, 100);
        
        // Schedule next mole
        const nextMoleDelay = Math.max(
            config.minMoleInterval,
            Math.floor((config.maxMoleInterval - config.minMoleInterval) * speedFactor * intervalMultiplier / moleFrequency)
        );
        
        gameState.nextMoleTimer = setTimeout(spawnMole, nextMoleDelay);
    }, moleTime);
}

/**
 * Handle whacking a mole
 */
function whackMole(holeIndex) {
    // Modified check to allow whacking during the grace period
    if (!gameState.isPlaying) return;
    
    // If this is the active mole or it's in the hiding grace period
    const isActiveMole = holeIndex === gameState.activeMole;
    const isHidingActiveMole = gameState.moleHiding && holeIndex === gameState.activeMole;
    
    if (!isActiveMole && !isHidingActiveMole) return;
    
    // Prevent double-whacking
    if (elements.moles[holeIndex].classList.contains('whacked')) return;
    
    // Get the mole type data
    const moleType = config.moleTypes[gameState.currentMoleType];
    
    // Play appropriate sound based on mole type
    switch (gameState.currentMoleType) {
        case 'golden':
            playSound(audio.golden);
            break;
        case 'bomb':
            playSound(audio.bomb);
            break;
        case 'rainbow':
            playSound(audio.rainbow);
            break;
        default:
            playSound(audio.whack);
    }
    
    // Calculate points based on how quickly the player whacked the mole
    const whackTime = Date.now() - gameState.currentMoleStart;
    const timeBonus = Math.max(
        config.minPoints,
        Math.floor(config.maxPoints - (whackTime / config.pointsDecayRate))
    );
    
    // Calculate combo
    const timeSinceLastWhack = Date.now() - gameState.lastWhackTime;
    if (timeSinceLastWhack <= config.comboTimeWindow) {
        gameState.combo++;
        gameState.comboMultiplier = Math.min(config.maxCombo, 1 + (gameState.combo * 0.1));
        
        // Show combo and play combo sound if it's getting high
        updateComboDisplay();
        if (gameState.combo >= 3) {
            playSound(audio.combo);
        }
    } else {
        gameState.combo = 0;
        gameState.comboMultiplier = 1;
        elements.comboDisplay.style.display = 'none';
    }
    
    gameState.lastWhackTime = Date.now();
    
    // Calculate points with power-ups
    let pointsMultiplier = gameState.comboMultiplier;
    
    // Apply double points power-up if active
    if (gameState.activePowerUps.doublePoints) {
        pointsMultiplier *= 2;
    }
    
    // Final points calculation
    const pointsEarned = Math.round(moleType.points * timeBonus * pointsMultiplier);
    
    // Update score
    gameState.score += pointsEarned;
    elements.scoreDisplay.textContent = gameState.score;
    
    // Check for difficulty change
    updateDifficulty();
    
    // Show points popup
    showPointsPopup(holeIndex, pointsEarned);
    
    // Track fastest whack time
    if (whackTime < gameState.fastestWhack && gameState.currentMoleType !== 'bomb') {
        gameState.fastestWhack = whackTime;
        elements.fastestWhackDisplay.textContent = whackTime;
        
        // Check for quick whack achievement
        if (whackTime <= config.achievementThresholds.fastestWhack) {
            gameState.achievements.quickWhack = true;
        }
    }
    
    // Show whack animation
    const mole = elements.moles[holeIndex];
    mole.classList.add('whacked');
    mole.classList.remove('active');
    
    // Clear mole timer as we've whacked it
    if (gameState.moleTimer) {
        clearTimeout(gameState.moleTimer);
    }
    
    // Reset after animation
    setTimeout(() => {
        mole.classList.remove('whacked');
        mole.style.backgroundColor = '';
        mole.style.background = '';
        mole.innerHTML = '';
        
        // Schedule next mole
        const nextMoleDelay = Math.max(
            config.minMoleInterval,
            Math.floor((config.maxMoleInterval - config.minMoleInterval) * gameState.difficulty)
        );
        
        gameState.nextMoleTimer = setTimeout(spawnMole, nextMoleDelay);
    }, config.whackAnimationTime);
    
    // Update for active mole
    gameState.activeMole = null;
    
    // Create colorful particle effect
    const holeRect = elements.holes[holeIndex].getBoundingClientRect();
    const boardRect = document.querySelector('.game-board').getBoundingClientRect();
    const relativeX = holeRect.left - boardRect.left + holeRect.width / 2;
    const relativeY = holeRect.top - boardRect.top + holeRect.height / 2;
    
    // Particle color based on mole type and points
    let particleColor;
    if (gameState.currentMoleType === 'golden') {
        particleColor = '#FFD700';
    } else if (gameState.currentMoleType === 'bomb') {
        particleColor = '#ff0000';
    } else if (gameState.currentMoleType === 'rainbow') {
        // Random colors for rainbow mole
        particleColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    } else {
        particleColor = pointsEarned > 0 ? '#4caf50' : '#f44336';
    }
    
    createParticles(relativeX, relativeY, particleColor);
    
    // Check for power-up chance
    checkForPowerUp();
}

/**
 * Show points popup
 */
function showPointsPopup(holeIndex, points) {
    const hole = elements.holes[holeIndex];
    const pointsDisplay = document.createElement('div');
    pointsDisplay.className = 'points-popup';
    
    if (points > 0) {
        pointsDisplay.textContent = `+${points}`;
        pointsDisplay.style.color = '#4ecdc4';
    } else {
        pointsDisplay.textContent = points;
        pointsDisplay.style.color = '#ff6b6b';
    }
    
    // Position it above the hole
    const holeRect = hole.getBoundingClientRect();
    const boardRect = document.querySelector('.game-board').getBoundingClientRect();
    
    pointsDisplay.style.left = `${holeRect.left - boardRect.left + (holeRect.width / 2)}px`;
    pointsDisplay.style.top = `${holeRect.top - boardRect.top - 20}px`;
    
    document.querySelector('.game-board').appendChild(pointsDisplay);
    
    // Animate and remove
    setTimeout(() => {
        pointsDisplay.style.opacity = '0';
        pointsDisplay.style.transform = 'translateY(-30px)';
        setTimeout(() => {
            document.querySelector('.game-board').removeChild(pointsDisplay);
        }, 500);
    }, 0);
}

/**
 * Update combo display
 */
function updateComboDisplay() {
    elements.comboDisplay.style.display = 'block';
    elements.comboDisplay.textContent = `Combo x${gameState.comboMultiplier.toFixed(1)}`;
    
    // Add special effects for high combos
    if (gameState.combo >= 5) {
        elements.comboDisplay.classList.add('high-combo');
    } else {
        elements.comboDisplay.classList.remove('high-combo');
    }
    
    // Animate
    elements.comboDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => {
        elements.comboDisplay.style.transform = 'scale(1)';
    }, 100);
}

/**
 * End the game
 */
function endGame() {
    // Stop game loop
    clearInterval(gameState.gameTimer);
    gameState.isPlaying = false;
    
    // Play game over sound
    playSound(audio.gameOver);
    
    // Clear mole timers
    if (gameState.moleTimer) {
        clearTimeout(gameState.moleTimer);
    }
    
    if (gameState.nextMoleTimer) {
        clearTimeout(gameState.nextMoleTimer);
    }
    
    // Hide any active moles
    elements.moles.forEach(mole => {
        mole.classList.remove('active');
        mole.classList.remove('whacked');
    });
    
    // Update game stats
    gameState.gamesPlayed++;
    elements.gamesPlayedDisplay.textContent = gameState.gamesPlayed;
    
    // Check achievements
    gameState.achievements.firstGame = true;
    
    if (gameState.gamesPlayed >= config.achievementThresholds.gamesPlayed[0]) {
        gameState.achievements.dedicated = true;
    }
    
    if (gameState.score >= config.achievementThresholds.score[0]) {
        gameState.achievements.score50 = true;
    }
    
    if (gameState.score >= config.achievementThresholds.score[1]) {
        gameState.achievements.score100 = true;
    }
    
    if (gameState.score >= config.achievementThresholds.score[2]) {
        gameState.achievements.score200 = true;
    }
    
    // Update achievements display
    updateAchievements();
    
    // Add to high scores if eligible
    addHighScore();
    
    // Save game data
    saveGameData();
    
    // Reset UI
    elements.startButton.disabled = false;
    elements.resetButton.disabled = false;
    
    // Show game over screen
    showGameOverScreen();
    
    // Show post-game ad
    showPostGameAd();
}

/**
 * Reset the game without starting
 */
function resetGame() {
    // Stop game loop
    clearInterval(gameState.gameTimer);
    
    // Clear mole timers
    if (gameState.moleTimer) {
        clearTimeout(gameState.moleTimer);
    }
    
    if (gameState.nextMoleTimer) {
        clearTimeout(gameState.nextMoleTimer);
    }
    
    // Reset game state
    gameState.score = 0;
    gameState.time = config.initialGameTime;
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.activeMole = null;
    gameState.difficulty = 1;
    gameState.difficultyLevel = 0;
    
    // Hide any active moles
    elements.moles.forEach(mole => {
        mole.classList.remove('active');
        mole.classList.remove('whacked');
    });
    
    // Update UI
    elements.scoreDisplay.textContent = gameState.score;
    elements.timeDisplay.textContent = gameState.time;
    
    // Reset buttons
    elements.startButton.disabled = false;
    elements.resetButton.disabled = false;
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
 * Show post-game ad
 */
function showPostGameAd() {
    // Show ad after a delay
    setTimeout(() => {
        elements.postGameAd.style.opacity = '1';
        elements.postGameAd.style.pointerEvents = 'all';
        
        // Auto-hide after a longer delay
        setTimeout(() => {
            hidePostGameAd();
        }, 8000);
    }, 2000);
}

/**
 * Hide post-game ad
 */
function hidePostGameAd() {
    elements.postGameAd.style.opacity = '0';
    elements.postGameAd.style.pointerEvents = 'none';
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
        date: new Date().toISOString()
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
        if (!highScores["Whack-a-Mole Game"]) {
            highScores["Whack-a-Mole Game"] = [];
        }
        
        // Add new score
        highScores["Whack-a-Mole Game"].push({
            name: playerName,
            score: gameState.score,
            date: new Date().toISOString()
        });
        
        // Sort scores (higher is better)
        highScores["Whack-a-Mole Game"].sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        if (highScores["Whack-a-Mole Game"].length > 10) {
            highScores["Whack-a-Mole Game"] = highScores["Whack-a-Mole Game"].slice(0, 10);
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
            
            // Display player name if available
            if (score.name) {
                listItem.textContent = `${score.name}: ${score.score} points - ${formattedDate}`;
            } else {
                listItem.textContent = `${score.score} points - ${formattedDate}`;
            }
            
            elements.highScoresList.appendChild(listItem);
        });
    }
}

/**
 * Update achievements display
 */
function updateAchievements() {
    if (!elements.achievementsGrid) return;
    
    const achievements = elements.achievementsGrid.querySelectorAll('.achievement');
    
    achievements.forEach(achievement => {
        const type = achievement.getAttribute('data-achievement');
        
        if (gameState.achievements[type]) {
            achievement.classList.add('unlocked');
        } else {
            achievement.classList.remove('unlocked');
        }
    });
}

/**
 * Save game data to localStorage
 */
function saveGameData() {
    try {
        const gameData = {
            gamesPlayed: gameState.gamesPlayed,
            highScores: gameState.highScores,
            fastestWhack: gameState.fastestWhack,
            achievements: gameState.achievements
        };
        
        localStorage.setItem(config.storageKey, JSON.stringify(gameData));
    } catch (e) {
        console.error('Failed to save game data:', e);
    }
}

/**
 * Load game data from localStorage
 */
function loadGameData() {
    try {
        const savedData = localStorage.getItem(config.storageKey);
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Update game state with saved data
            gameState.gamesPlayed = parsedData.gamesPlayed || 0;
            gameState.highScores = parsedData.highScores || [];
            gameState.fastestWhack = parsedData.fastestWhack || Infinity;
            gameState.achievements = parsedData.achievements || {
                firstGame: false,
                score50: false,
                score100: false,
                score200: false,
                quickWhack: false,
                dedicated: false
            };
        }
        
        // Also check for high scores in the shared high scores object
        try {
            const sharedHighScores = JSON.parse(localStorage.getItem('highScores')) || {};
            if (sharedHighScores["Whack-a-Mole Game"] && sharedHighScores["Whack-a-Mole Game"].length > 0) {
                // Merge the shared high scores with the game-specific high scores
                const combinedScores = [...gameState.highScores];
                
                // Add scores from shared high scores that aren't already in our list
                sharedHighScores["Whack-a-Mole Game"].forEach(sharedScore => {
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
        }
        
    } catch (e) {
        console.error('Failed to load game data:', e);
        // Ensure game state is initialized with defaults
        gameState.gamesPlayed = 0;
        gameState.highScores = [];
        gameState.fastestWhack = Infinity;
        gameState.achievements = {
            firstGame: false,
            score50: false,
            score100: false,
            score200: false,
            quickWhack: false,
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
    
    // Update fastest whack display
    if (gameState.fastestWhack !== Infinity) {
        elements.fastestWhackDisplay.textContent = gameState.fastestWhack;
    } else {
        elements.fastestWhackDisplay.textContent = 0;
    }
    
    // Update high score displays
    if (gameState.highScores.length > 0) {
        const bestScore = gameState.highScores[0].score;
        elements.bestScoreDisplay.textContent = bestScore;
        elements.highScoreDisplay.textContent = bestScore;
    }
    
    // Update high scores list
    updateHighScoresList();
}

/**
 * Social sharing functions
 */
function shareOnTwitter() {
    const text = `I just scored ${gameState.score} points in Whack-a-Mole on Dumbass Games! Can you beat my score?`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function shareOnFacebook() {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

function shareOnWhatsApp() {
    const text = `I just scored ${gameState.score} points in Whack-a-Mole on Dumbass Games! Can you beat my score? ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

/**
 * Set up theme selector
 */
function setupThemeSelector() {
    elements.themeSelector.className = 'theme-selector';
    
    // Create theme buttons
    const themes = ['default', 'farm', 'desert', 'snow', 'space'];
    
    themes.forEach(theme => {
        const button = document.createElement('div');
        button.className = `theme-button theme-${theme}`;
        button.dataset.theme = theme;
        button.title = `${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme`;
        
        button.addEventListener('click', () => {
            applyTheme(theme);
            
            // Save theme preference
            gameState.currentTheme = theme;
            saveGameData();
        });
        
        elements.themeSelector.appendChild(button);
    });
    
    // Add to game board
    document.querySelector('.game-board').appendChild(elements.themeSelector);
}

/**
 * Apply a theme
 */
function applyTheme(theme) {
    const gameBoard = document.querySelector('.game-board');
    
    // Remove all theme classes
    gameBoard.classList.remove('theme-default', 'theme-farm', 'theme-desert', 'theme-snow', 'theme-space');
    
    // Add selected theme class
    if (theme !== 'default') {
        gameBoard.classList.add(`theme-${theme}`);
    }
    
    // Update theme buttons
    const themeButtons = document.querySelectorAll('.theme-button');
    themeButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.theme === theme) {
            button.classList.add('active');
        }
    });
}

/**
 * Set up power-up display
 */
function setupPowerUpDisplay() {
    elements.powerUpDisplay.className = 'power-up-display';
    elements.powerUpDisplay.style.display = 'none';
    document.querySelector('.game-board').appendChild(elements.powerUpDisplay);
}

/**
 * Set up difficulty indicator
 */
function setupDifficultyIndicator() {
    elements.difficultyIndicator.className = 'difficulty-indicator';
    
    // Create pips for each difficulty level
    for (let i = 0; i < config.difficultyLevels.length; i++) {
        const pip = document.createElement('div');
        pip.className = 'difficulty-pip';
        if (i === 0) pip.classList.add('active');
        elements.difficultyIndicator.appendChild(pip);
    }
    
    document.querySelector('.game-board').appendChild(elements.difficultyIndicator);
}

/**
 * Set up particles container
 */
function setupParticlesContainer() {
    elements.particlesContainer.className = 'particles-container';
    document.querySelector('.game-board').appendChild(elements.particlesContainer);
}

/**
 * Create particle effect at a position
 */
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        particle.style.transform = `translate(${Math.cos(angle) * speed * 20}px, ${Math.sin(angle) * speed * 20}px)`;
        
        elements.particlesContainer.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }
}

/**
 * Update difficulty based on score
 */
function updateDifficulty() {
    const score = gameState.score;
    let newLevel = 0;
    
    // Find highest difficulty level player has reached
    for (let i = 0; i < config.difficultyLevels.length; i++) {
        if (score >= config.difficultyLevels[i].score) {
            newLevel = i;
        } else {
            break;
        }
    }
    
    // Update if changed
    if (newLevel !== gameState.difficultyLevel) {
        gameState.difficultyLevel = newLevel;
        const diffLevel = config.difficultyLevels[newLevel];
        
        // Apply difficulty settings
        gameState.difficulty = diffLevel.speedFactor;
        
        // Update difficulty display subtly instead of showing a popup notification
        updateDifficultyIndicator();
        
        // Create particle effect at the bottom where the difficulty indicator is
        const boardRect = document.querySelector('.game-board').getBoundingClientRect();
        createParticles(
            boardRect.width / 2, 
            boardRect.height - 20, 
            newLevel === 0 ? '#4caf50' : 
            newLevel === 1 ? '#8bc34a' : 
            newLevel === 2 ? '#ffc107' : 
            newLevel === 3 ? '#ff9800' : '#f44336',
            10 // Fewer particles to be less distracting
        );
    }
}

/**
 * Update difficulty indicator
 */
function updateDifficultyIndicator() {
    const pips = elements.difficultyIndicator.querySelectorAll('.difficulty-pip');
    
    pips.forEach((pip, index) => {
        pip.classList.remove('active');
        if (index <= gameState.difficultyLevel) {
            pip.classList.add('active');
        }
    });
}

/**
 * Show notification
 */
function showNotification(text, duration = 2000) {
    // Don't show notifications for difficulty changes
    if (text.startsWith("Difficulty:")) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    notification.style.position = 'absolute';
    notification.style.top = '10%'; // Position at top instead of center
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // More transparent
    notification.style.color = '#fff';
    notification.style.padding = '8px 16px'; // Smaller padding
    notification.style.borderRadius = '20px';
    notification.style.fontWeight = 'bold';
    notification.style.fontSize = '18px'; // Smaller font
    notification.style.zIndex = '100';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    
    document.querySelector('.game-board').appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '0.8'; // Not fully opaque
    }, 0);
    
    // Fade out and remove faster
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, Math.min(1000, duration)); // Shorter duration, max 1 second
}

/**
 * Check for power-up activation
 */
function checkForPowerUp() {
    // Different chances based on mole type
    let chance = 5; // Base 5% chance
    
    if (gameState.currentMoleType === 'golden') {
        chance = config.powerUps.timeSlow.chance;
    } else if (gameState.currentMoleType === 'rainbow') {
        chance = config.powerUps.doublePoints.chance;
    }
    
    if (Math.random() * 100 < chance) {
        // Determine which power-up to activate
        let powerUpType;
        
        if (gameState.currentMoleType === 'golden') {
            powerUpType = 'timeSlow';
        } else if (gameState.currentMoleType === 'rainbow') {
            powerUpType = 'doublePoints';
        } else {
            // Random power-up
            const powerUpTypes = Object.keys(config.powerUps);
            powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        }
        
        // Activate the power-up
        activatePowerUp(powerUpType);
    }
}

/**
 * Activate a power-up
 */
function activatePowerUp(powerUpType) {
    const powerUp = config.powerUps[powerUpType];
    
    // Already active? Just refresh the timer
    if (gameState.activePowerUps[powerUpType]) {
        clearTimeout(gameState.activePowerUps[powerUpType].timer);
    } else {
        // Show activation notification
        showNotification(`${powerUp.icon} ${powerUp.name} activated!`);
        
        // Apply power-up effects
        applyPowerUpEffects(powerUpType, true);
    }
    
    // Set expiration timer
    const timer = setTimeout(() => {
        // Remove power-up effects
        applyPowerUpEffects(powerUpType, false);
        
        // Remove from active power-ups
        delete gameState.activePowerUps[powerUpType];
        
        // Update display
        updatePowerUpDisplay();
        
    }, powerUp.duration);
    
    // Store in active power-ups
    gameState.activePowerUps[powerUpType] = {
        timer: timer,
        endTime: Date.now() + powerUp.duration
    };
    
    // Update display
    updatePowerUpDisplay();
}

/**
 * Apply power-up effects
 */
function applyPowerUpEffects(powerUpType, activate) {
    switch (powerUpType) {
        case 'timeSlow':
            // No direct application needed - handled in spawnMole
            break;
            
        case 'doublePoints':
            // No direct application needed - handled in whackMole
            break;
            
        case 'hammerFrenzy':
            if (activate) {
                // Start auto-whacking
                startAutoWhack();
            } else {
                // Stop auto-whacking
                stopAutoWhack();
            }
            break;
    }
}

/**
 * Auto-whack functionality for hammer frenzy
 */
let autoWhackInterval = null;

function startAutoWhack() {
    // Clear any existing interval
    stopAutoWhack();
    
    // Start new interval
    autoWhackInterval = setInterval(() => {
        // Only whack if a mole is active
        if (gameState.activeMole !== null) {
            whackMole(gameState.activeMole);
        }
    }, 500); // Try to whack every 500ms
}

function stopAutoWhack() {
    if (autoWhackInterval) {
        clearInterval(autoWhackInterval);
        autoWhackInterval = null;
    }
}

/**
 * Update power-up display
 */
function updatePowerUpDisplay() {
    // Hide if no active power-ups
    if (Object.keys(gameState.activePowerUps).length === 0) {
        elements.powerUpDisplay.style.display = 'none';
        return;
    }
    
    // Show and update display
    elements.powerUpDisplay.style.display = 'block';
    elements.powerUpDisplay.innerHTML = '';
    
    // Sort power-ups by remaining time
    const powerUps = Object.entries(gameState.activePowerUps)
        .map(([type, data]) => ({
            type,
            timeLeft: data.endTime - Date.now()
        }))
        .filter(p => p.timeLeft > 0)
        .sort((a, b) => a.timeLeft - b.timeLeft);
    
    // Show first power-up with countdown
    if (powerUps.length > 0) {
        const powerUp = powerUps[0];
        const powerUpConfig = config.powerUps[powerUp.type];
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'power-up-icon';
        iconSpan.textContent = powerUpConfig.icon;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = powerUpConfig.name;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'power-up-time';
        timeSpan.textContent = ` ${Math.ceil(powerUp.timeLeft / 1000)}s`;
        
        elements.powerUpDisplay.appendChild(iconSpan);
        elements.powerUpDisplay.appendChild(nameSpan);
        elements.powerUpDisplay.appendChild(timeSpan);
        
        // If multiple power-ups, add indicator
        if (powerUps.length > 1) {
            const moreSpan = document.createElement('span');
            moreSpan.textContent = ` +${powerUps.length - 1} more`;
            elements.powerUpDisplay.appendChild(moreSpan);
        }
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame); 
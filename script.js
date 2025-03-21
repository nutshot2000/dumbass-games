// This will handle any global site functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dumbass Games website loaded!');
    
    // Add a little animation to the header
    const header = document.querySelector('header h1');
    if (header) {
        header.style.opacity = '0';
        
        setTimeout(() => {
            header.style.transition = 'opacity 1s ease';
            header.style.opacity = '1';
        }, 300);
    }
    
    // Handle subscription form
    const subscribeForm = document.getElementById('subscribeForm');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = subscribeForm.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email) {
                // In a real implementation, you would send this to your server
                console.log(`Subscription request for: ${email}`);
                
                // Show success message
                emailInput.value = '';
                alert('Thanks for subscribing! We\'ll notify you when new games are added.');
                
                // Store in localStorage for demo purposes
                const subscribers = JSON.parse(localStorage.getItem('subscribers') || '[]');
                subscribers.push(email);
                localStorage.setItem('subscribers', JSON.stringify(subscribers));
            }
        });
    }
    
    // Load top players (In a real implementation, this would come from a server)
    loadTopPlayers();
    
    // Setup cookie consent
    setupCookieConsent();
    
    // Track page view for analytics
    trackPageView();
    
    // Lazy load images to improve page speed (AdSense likes fast pages)
    lazyLoadImages();
    
    // Setup ad containers to be responsive
    setupAdContainers();
});

// Sharing Functionality
window.shareOnFacebook = function() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`, '_blank');
};

window.shareOnTwitter = function() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
};

window.shareOnWhatsApp = function() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://wa.me/?text=${title} ${url}`, '_blank');
};

// Bookmark Functionality
window.bookmarkPage = function() {
    if (window.sidebar && window.sidebar.addPanel) { // Firefox < 23
        window.sidebar.addPanel(document.title, window.location.href, '');
    } else if (window.external && ('AddFavorite' in window.external)) { // IE
        window.external.AddFavorite(window.location.href, document.title);
    } else { // Modern browsers
        // Alert the user to press Ctrl+D (or Cmd+D for Mac)
        const userAgent = navigator.userAgent.toLowerCase();
        const isMac = userAgent.indexOf('mac') !== -1;
        const key = isMac ? '⌘+D' : 'Ctrl+D';
        alert(`Press ${key} to bookmark this page`);
    }
};

function loadTopPlayers() {
    // In a real implementation, this would be loaded from a server
    const topPlayersList = document.getElementById('topPlayersList');
    if (!topPlayersList) return;
    
    // Sample data
    const topPlayers = [
        { name: 'CrazyClicker', game: 'Clicker Game', score: 143 },
        { name: 'MemoryMaster', game: 'Memory Game', score: 980 },
        { name: 'FastFingers', game: 'Clicker Game', score: 137 },
        { name: 'BrainPower', game: 'Memory Game', score: 945 },
        { name: 'ClickManiac', game: 'Clicker Game', score: 129 }
    ];
    
    // Clear loading message
    topPlayersList.innerHTML = '';
    
    // Add players to the list
    topPlayers.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} - ${player.score} (${player.game})`;
        topPlayersList.appendChild(li);
    });
}

// Track page view (simplified analytics)
function trackPageView() {
    const page = window.location.pathname;
    const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
    
    if (!pageViews[page]) {
        pageViews[page] = 0;
    }
    
    pageViews[page]++;
    localStorage.setItem('pageViews', JSON.stringify(pageViews));
    
    console.log(`Page view tracked: ${page} (${pageViews[page]} views)`);
    
    // In a real implementation, you would send this data to your analytics server
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: page
        });
    }
}

function setupCookieConsent() {
    // Check if user has already consented
    const consentStatus = localStorage.getItem('cookieConsent');
    if (consentStatus === 'accepted' || consentStatus === 'rejected' || consentStatus === 'customized') {
        // If they rejected cookies, we should still respect their choice but not load analytics
        if (consentStatus === 'rejected') {
            disableAnalytics();
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
            enableAnalytics();
        } else if (choice === 'rejected') {
            disableAnalytics();
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

// Functions for managing analytics based on consent
function enableAnalytics() {
    // In a real implementation, this would enable your analytics scripts
    console.log('Analytics enabled based on user consent');
    
    // If Google Analytics is being used
    if (typeof gtag === 'function') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted',
            'ad_storage': 'granted'
        });
    }
}

function disableAnalytics() {
    // In a real implementation, this would disable analytics tracking
    console.log('Analytics disabled based on user preference');
    
    // If Google Analytics is being used
    if (typeof gtag === 'function') {
        gtag('consent', 'update', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied'
        });
    }
}

// Lazy load images for better performance (AdSense loves fast sites)
function lazyLoadImages() {
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports native lazy loading
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
    } else {
        // Could implement a fallback here for older browsers
        console.log('Browser does not support native lazy loading');
    }
}

// Setup ad containers to be more responsive and AdSense-friendly
function setupAdContainers() {
    const adContainers = document.querySelectorAll('.ad-container');
    
    adContainers.forEach(container => {
        // Add a subtle animation to make ads more noticeable (but not annoying)
        container.addEventListener('mouseenter', () => {
            container.style.transform = 'translateY(-2px)';
            container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        });
        
        container.addEventListener('mouseleave', () => {
            container.style.transform = 'translateY(0)';
            container.style.boxShadow = 'none';
        });
    });
    
    // Post-game ad specific functionality
    const postGameAd = document.getElementById('postGameAd');
    if (postGameAd) {
        // This would be triggered when a game ends
        // For demo purposes, we'll set a timeout
        setTimeout(() => {
            postGameAd.classList.add('visible');
        }, 60000); // Show after 1 minute for demo purposes
    }
}

// Add High Score Functions

// Function to save a score
function saveScore(gameName, playerName, score) {
    // Get existing scores or create new array
    let highScores = JSON.parse(localStorage.getItem('highScores')) || {};
    
    // Initialize game scores if not exist
    if (!highScores[gameName]) {
        highScores[gameName] = [];
    }
    
    // Add new score
    highScores[gameName].push({
        name: playerName,
        score: score,
        date: new Date().toISOString()
    });
    
    // Sort scores (higher is better)
    highScores[gameName].sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    if (highScores[gameName].length > 10) {
        highScores[gameName] = highScores[gameName].slice(0, 10);
    }
    
    // Save back to localStorage
    localStorage.setItem('highScores', JSON.stringify(highScores));
    
    // Update the display
    displayTopPlayers();
}

// Function to display top players in the sidebar
function displayTopPlayers() {
    const topPlayersList = document.getElementById('topPlayersList');
    if (!topPlayersList) return;
    
    // Get high scores from localStorage
    const highScores = JSON.parse(localStorage.getItem('highScores')) || {};
    
    // If no scores yet
    if (Object.keys(highScores).length === 0) {
        topPlayersList.innerHTML = '<li>No scores yet. Play a game!</li>';
        return;
    }
    
    // Clear the list
    topPlayersList.innerHTML = '';
    
    // Loop through each game
    for (const gameName in highScores) {
        if (highScores[gameName].length > 0) {
            // Add game header
            const gameHeader = document.createElement('li');
            gameHeader.className = 'game-header';
            gameHeader.textContent = gameName;
            topPlayersList.appendChild(gameHeader);
            
            // Add top 3 scores for this game
            for (let i = 0; i < Math.min(3, highScores[gameName].length); i++) {
                const score = highScores[gameName][i];
                const scoreItem = document.createElement('li');
                scoreItem.innerHTML = `${score.name}: <strong>${score.score}</strong>`;
                topPlayersList.appendChild(scoreItem);
            }
        }
    }
}

// Function to prompt user for name and save score
function promptAndSaveScore(gameName, score) {
    let playerName = prompt(`You scored ${score} in ${gameName}! Enter your name:`, "Player");
    
    // If user cancels prompt or enters empty string
    if (playerName === null || playerName.trim() === '') {
        playerName = "Anonymous";
    }
    
    saveScore(gameName, playerName, score);
}

// Initialize top players display when page loads
document.addEventListener('DOMContentLoaded', function() {
    displayTopPlayers();
}); 
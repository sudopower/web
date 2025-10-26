// Main initialization function
function initializeApp() {
    // Only run animation on the root page (index.html)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '') {
        startAnimation();
    }
    
    // Highlight the active tab
    highlightActiveTab();
    
    // Setup window buttons
    setupCloseButton();
    setupMinimizeButton();
    setupMaximizeButton();
}

// Start the app when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);

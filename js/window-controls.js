// Close button functionality
function setupCloseButton() {
    const closeButton = document.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            // Since window.close() doesn't work for tabs not opened by JS,
            // we'll show a confirmation and redirect to GitHub repo
            if (confirm('Close this terminal? (This will redirect to GitHub repository)')) {
                // Redirect to GitHub repository
                window.location.href = 'https://github.com/sudopower';
            }
        });
    }
}

// Maximize button functionality
function setupMaximizeButton() {
    const maximizeButton = document.querySelector('.maximize');
    const terminal = document.querySelector('.terminal');
    
    if (maximizeButton && terminal) {
        maximizeButton.addEventListener('click', function() {
            if (terminal.classList.contains('maximized')) {
                // Restore to normal size
                terminal.classList.remove('maximized');
                document.body.style.overflow = 'auto';
            } else {
                // Maximize to full screen
                terminal.classList.add('maximized');
                document.body.style.overflow = 'hidden';
            }
        });
    }
}

// Minimize button functionality
function setupMinimizeButton() {
    const minimizeButton = document.querySelector('.minimize');
    const terminal = document.querySelector('.terminal');
    const terminalSymbol = document.getElementById('terminal-symbol');
    const voidMessage = document.getElementById('void-message');
    
    if (minimizeButton && terminal && terminalSymbol && voidMessage) {
        minimizeButton.addEventListener('click', function() {
            if (terminal.classList.contains('minimized')) {
                // Restore terminal
                terminal.classList.remove('minimized');
                terminalSymbol.style.display = 'none';
                voidMessage.style.display = 'none';
            } else {
                // Minimize terminal
                terminal.classList.add('minimized');
                terminalSymbol.style.display = 'flex';
                voidMessage.style.display = 'block';
            }
        });
        
        // Click on terminal symbol to restore
        terminalSymbol.addEventListener('click', function() {
            terminal.classList.remove('minimized');
            terminalSymbol.style.display = 'none';
            voidMessage.style.display = 'none';
        });
    }
}

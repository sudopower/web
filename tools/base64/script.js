// Base64 Encode/Decode Tool JavaScript

function encodeBase64() {
    const inputText = document.getElementById('inputText').value;
    const outputText = document.getElementById('outputText');
    const messageArea = document.getElementById('messageArea');
    
    if (!inputText.trim()) {
        showMessage('Please enter some text to encode.', 'error');
        return;
    }
    
    try {
        const encoded = btoa(unescape(encodeURIComponent(inputText)));
        outputText.value = encoded;
    } catch (error) {
        showMessage('Error encoding text: ' + error.message, 'error');
    }
}

function decodeBase64() {
    const inputText = document.getElementById('inputText').value;
    const outputText = document.getElementById('outputText');
    const messageArea = document.getElementById('messageArea');
    
    if (!inputText.trim()) {
        showMessage('Please enter a Base64 string to decode.', 'error');
        return;
    }
    
    try {
        // Remove any whitespace and newlines
        const cleanInput = inputText.replace(/\s/g, '');
        
        // Validate Base64 format
        if (!isValidBase64(cleanInput)) {
            showMessage('Invalid Base64 format. Please check your input.', 'error');
            return;
        }
        
        const decoded = decodeURIComponent(escape(atob(cleanInput)));
        outputText.value = decoded;
    } catch (error) {
        showMessage('Error decoding Base64: ' + error.message, 'error');
    }
}

function isValidBase64(str) {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}

function clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('outputText').value = '';
    clearMessage();
}

function copyOutput() {
    const outputText = document.getElementById('outputText');
    
    if (!outputText.value.trim()) {
        showMessage('No output to copy.', 'error');
        return;
    }
    
    outputText.select();
    outputText.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(outputText.value).catch(() => {
            showMessage('Failed to copy to clipboard.', 'error');
        });
    }
}

function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    const messageClass = type === 'error' ? 'error-message' : 'success-message';
    
    messageArea.innerHTML = `<div class="${messageClass}">${message}</div>`;
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            clearMessage();
        }, 3000);
    }
}

function clearMessage() {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = '';
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl+Enter or Cmd+Enter to encode
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        encodeBase64();
    }
    
    // Ctrl+Shift+Enter or Cmd+Shift+Enter to decode
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        decodeBase64();
    }
    
    // Ctrl+E or Cmd+E to clear all
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        clearAll();
    }
    
    // Ctrl+C or Cmd+C to copy (when output is focused)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && 
        document.activeElement.id === 'outputText') {
        event.preventDefault();
        copyOutput();
    }
});

// Auto-detect if input looks like Base64 and suggest decode
document.getElementById('inputText').addEventListener('input', function() {
    const input = this.value.trim();
    if (input.length > 0 && isValidBase64(input.replace(/\s/g, ''))) {
        // Could add a visual indicator here if desired
        console.log('Input appears to be valid Base64');
    }
});

// Initialize the tool
document.addEventListener('DOMContentLoaded', function() {
    // Add some example text to help users understand the tool
    const inputText = document.getElementById('inputText');
    inputText.placeholder = 'Enter text to encode or Base64 string to decode...\n\nExamples:\n- "Hello World" (to encode)\n- "SGVsbG8gV29ybGQ=" (to decode)';
});

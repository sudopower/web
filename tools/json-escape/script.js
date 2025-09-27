// JSON Escape/Unescape Tool JavaScript

function escapeJson() {
    const inputText = document.getElementById('inputData').value;
    const outputText = document.getElementById('outputData');
    
    if (!inputText.trim()) {
        showMessage('Please enter some text to escape.', 'error');
        return;
    }
    
    try {
        // Escape the JSON string
        const escaped = JSON.stringify(inputText);
        outputText.value = escaped;
    } catch (error) {
        showMessage('Error escaping text: ' + error.message, 'error');
    }
}

function unescapeJson() {
    const inputText = document.getElementById('inputData').value;
    const outputText = document.getElementById('outputData');
    
    if (!inputText.trim()) {
        showMessage('Please enter an escaped JSON string to unescape.', 'error');
        return;
    }
    
    try {
        // Parse the escaped JSON string to unescape it
        const unescaped = JSON.parse(inputText);
        
        // If the result is an object or array, format it as JSON
        if (typeof unescaped === 'object' && unescaped !== null) {
            outputText.value = JSON.stringify(unescaped, null, 2);
        } else {
            // If it's a string or primitive, just display as is
            outputText.value = unescaped;
        }
    } catch (error) {
        showMessage('Error unescaping JSON: ' + error.message, 'error');
    }
}

function clearAll() {
    document.getElementById('inputData').value = '';
    document.getElementById('outputData').value = '';
    clearMessage();
}

function loadExample() {
    const exampleJson = {
        "name": "John Doe",
        "message": "Hello \"World\" with\nnewlines and\ttabs!",
        "data": {
            "value": "Special chars: \\ / \" ' \n \t \r",
            "array": [1, 2, "test", null]
        }
    };
    document.getElementById('inputData').value = JSON.stringify(exampleJson, null, 2);
}

function copyOutput() {
    const outputText = document.getElementById('outputData');
    
    if (!outputText.value.trim()) {
        showMessage('No output to copy.', 'error');
        return;
    }
    
    outputText.select();
    outputText.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
    } catch (err) {
        navigator.clipboard.writeText(outputText.value).catch(() => {
            showMessage('Failed to copy to clipboard.', 'error');
        });
    }
}

function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    const messageClass = type === 'error' ? 'error-message' : 'success-message';
    
    messageArea.innerHTML = `<div class="${messageClass}">${message}</div>`;
    
    // Auto-hide error messages after 5 seconds
    if (type === 'error') {
        setTimeout(() => {
            clearMessage();
        }, 5000);
    }
}

function clearMessage() {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = '';
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl+Enter or Cmd+Enter to escape
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        escapeJson();
    }
    
    // Ctrl+Shift+Enter or Cmd+Shift+Enter to unescape
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        unescapeJson();
    }
    
    // Ctrl+E or Cmd+E to clear all
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        clearAll();
    }
    
    // Ctrl+C or Cmd+C to copy (when output is focused)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && 
        document.activeElement.id === 'outputData') {
        event.preventDefault();
        copyOutput();
    }
});

// Initialize the tool
document.addEventListener('DOMContentLoaded', function() {
    // Add some helpful text to the input placeholder
    const inputData = document.getElementById('inputData');
    inputData.placeholder = 'Enter JSON to escape or escaped JSON to unescape...\n\nExamples:\n- {"name": "John", "message": "Hello \\"World\\""} (to escape)\n- "{\\"name\\": \\"John\\", \\"message\\": \\"Hello \\\\\\"World\\\\\\"\\"}" (to unescape)';
});

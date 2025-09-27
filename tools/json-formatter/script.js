// JSON Formatter & Validator

function formatJson() {
    const inputJson = document.getElementById('inputJson').value.trim();
    const outputJson = document.getElementById('outputJson');
    const indentation = document.getElementById('indentation').value;
    const minify = document.getElementById('minify').checked;
    
    if (!inputJson) {
        showMessage('Please enter JSON to format.', 'error');
        return;
    }
    
    try {
        // Parse JSON first to validate
        const jsonData = JSON.parse(inputJson);
        
        // Format JSON
        let formatted;
        if (minify) {
            formatted = JSON.stringify(jsonData);
        } else {
            const spaces = indentation === 'tab' ? '\t' : parseInt(indentation);
            formatted = JSON.stringify(jsonData, null, spaces);
        }
        
        outputJson.value = formatted;
        showValidationStatus(true, 'JSON is valid and formatted successfully!');
        
    } catch (error) {
        showValidationStatus(false, 'Invalid JSON: ' + error.message);
        showMessage('Invalid JSON: ' + error.message, 'error');
        outputJson.value = '';
    }
}



function showValidationStatus(isValid, message) {
    const statusDiv = document.getElementById('validationStatus');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
    statusDiv.style.display = 'flex';
    
    if (isValid) {
        statusDiv.className = 'validation-status status-valid';
        statusIcon.textContent = '✓';
        statusText.textContent = message;
    } else {
        statusDiv.className = 'validation-status status-invalid';
        statusIcon.textContent = '✗';
        statusText.textContent = message;
    }
}

function clearAll() {
    document.getElementById('inputJson').value = '';
    document.getElementById('outputJson').value = '';
    document.getElementById('indentation').value = '4';
    document.getElementById('minify').checked = false;
    document.getElementById('validationStatus').style.display = 'none';
    clearMessage();
}

function loadExample() {
    const exampleJson = {
        "name": "John Doe",
        "age": 30,
        "email": "john@example.com",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "address": {
            "street": "123 Main St",
            "city": "New York",
            "zipCode": "10001",
            "coordinates": {
                "lat": 40.7128,
                "lng": -74.0060
            }
        },
        "hobbies": ["reading", "coding", "traveling"],
        "scores": [95, 87, 92, 88],
        "metadata": {
            "lastLogin": "2024-01-20T15:45:00Z",
            "loginCount": 42,
            "preferences": {
                "theme": "dark",
                "language": "en",
                "notifications": true
            }
        }
    };
    
    document.getElementById('inputJson').value = JSON.stringify(exampleJson);
}

function copyOutput() {
    const outputJson = document.getElementById('outputJson');
    
    if (!outputJson.value.trim()) {
        showMessage('No output to copy.', 'error');
        return;
    }
    
    outputJson.select();
    outputJson.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
    } catch (err) {
        navigator.clipboard.writeText(outputJson.value).catch(() => {
            showMessage('Failed to copy to clipboard.', 'error');
        });
    }
}

function showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    const messageClass = type === 'error' ? 'error-message' : 'success-message';
    
    messageArea.innerHTML = `<div class="${messageClass}">${message}</div>`;
    
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

// Real-time validation as user types
let validationTimeout;
document.getElementById('inputJson').addEventListener('input', function() {
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => {
        const input = this.value.trim();
        if (input.length > 0) {
            try {
                JSON.parse(input);
                showValidationStatus(true, 'JSON is valid');
            } catch (error) {
                showValidationStatus(false, 'Invalid JSON: ' + error.message);
            }
        } else {
            document.getElementById('validationStatus').style.display = 'none';
        }
    }, 500); // Debounce validation
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl+Enter or Cmd+Enter to format
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        formatJson();
    }
    
    
    // Ctrl+E or Cmd+E to clear all
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        clearAll();
    }
    
    // Ctrl+C or Cmd+C to copy (when output is focused)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && 
        document.activeElement.id === 'outputJson') {
        event.preventDefault();
        copyOutput();
    }
});

// Initialize the tool
document.addEventListener('DOMContentLoaded', function() {
    // Add some helpful text to the input placeholder
    const inputJson = document.getElementById('inputJson');
    inputJson.placeholder = 'Enter your JSON here...\n\nExample:\n{"name":"John Doe","age":30,"email":"john@example.com","address":{"street":"123 Main St","city":"New York"}}';
});

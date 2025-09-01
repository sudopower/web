// Typing animation function
function typeWriter(element, text, speed = 50) {
    return new Promise((resolve) => {
        let i = 0;
        element.innerHTML = '';
        
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
}

// Typing animation function with cursor following
function typeWriterWithCursor(element, text, speed = 50) {
    return new Promise((resolve) => {
        let i = 0;
        element.innerHTML = '';
        
        function type() {
            if (i < text.length) {
                element.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
                i++;
                setTimeout(type, speed);
            } else {
                element.innerHTML = text;
                resolve();
            }
        }
        type();
    });
}

// Main animation sequence
async function startAnimation() {
    const quoteElement = document.getElementById('quote');
    const introElement = document.getElementById('intro');
    const emailElement = document.getElementById('email');
    const terminalElement = document.querySelector('.terminal');
    
    // Alan Turing quote about computing and art
    const quote = '"Sometimes it is the people no one imagines anything of who do the things that no one can imagine." - Alan Turing';
    
    // Type the quote first with following cursor
    await typeWriterWithCursor(quoteElement, quote, 60);
    
    // Wait a moment, then type the intro with following cursor
    await new Promise(resolve => setTimeout(resolve, 1000));
    await typeWriterWithCursor(introElement, "I'm Kiran | 💡 👨‍💻 🚀", 80);
    
    // Wait a moment, then type the email with following cursor
    await new Promise(resolve => setTimeout(resolve, 800));
    await typeWriterWithCursor(emailElement, 'Email me at: ', 80);
    
    // Add the email link after typing
    emailElement.innerHTML += '<a href="mailto:nkirandroid@gmail.com">nkirandroid@gmail.com</a>';
    
    // Add the final blinking cursor at the end
    emailElement.innerHTML += '<span class="cursor">|</span>';
    
    // Wait a moment after all text is typed, then start the glow animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    terminalElement.classList.add('glow-active');
}

// Start the animation when the page loads
document.addEventListener('DOMContentLoaded', startAnimation);

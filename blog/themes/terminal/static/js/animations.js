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

// Hardcoded quotes organized by authors
const quotes = {
    "Steve Jobs": [
        "Stay hungry, stay foolish",
        "Innovation distinguishes between a leader and a follower",
        "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work",
        "Have the courage to follow your heart and intuition. They somehow already know what you truly want to become",
        "Sometimes when you innovate, you make mistakes. It is best to admit them quickly and get on with improving your other innovations"
    ],
    "Elon Musk": [
        "When something is important enough, you do it even if the odds are not in your favour",
        "It is important to view knowledge as sort of a semantic tree -- make sure you understand the fundamental principles, ie the trunk and big branches, before you get into the leaves/details or there is nothing for them to hang on to",
        "You get paid in direct proportion to the difficulty of problems you solve",
        "You should take the approach that you're wrong. Your goal is to be less wrong",
        "Constantly seek criticism. A well thought out critique of whatever you're doing is as valuable as gold"
    ],
    "Confucius": [
        "Choose a job you love and you will never have to work a day in your life"
    ],
    "Plato": [
        "The first and best victory is to conquer self"
    ],
    "Aristotle": [
        "We are what we repeatedly do. Excellence then is not an act, but a habit",
        "Quality is not act. It is a habit"
    ],
    "Mark Twain": [
        "If we were supposed to talk more than we listen, we would have two mouths and one ear"
    ],
    "Benjamin Franklin": [
        "He that cannot obey, cannot command"
    ],
    "Albert Einstein": [
        "Without changing our patterns of thought, we will not be able to solve the problems that we created with our current patterns of thought",
        "If you can't explain it simply, you don't understand it well enough"
    ],
    "Chinese Proverb": [
        "In every crisis, there is opportunity"
    ],
    "Thomas A. Edison": [
        "Many of life's failures are people who did not realize how close they were to success when they gave up"
    ],
    "Peter Drucker": [
        "The best way to predict the future is to create it"
    ],
    "Yoda": [
        "Do or do not… there is no try"
    ],
    "Marcus Aurelius": [
        "You have power over your mind, not outside events. Realize this, and you will find strength"
    ],
    "Seneca": [
        "Most powerful is he who has himself in his own power"
    ],
    "Dalai Lama": [
        "A disciplined mind leads to happiness, and an undisciplined mind leads to suffering"
    ]
};

// Function to get a random quote from the hardcoded list
function getRandomQuote() {
    const authors = Object.keys(quotes);
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const authorQuotes = quotes[randomAuthor];
    const randomQuote = authorQuotes[Math.floor(Math.random() * authorQuotes.length)];
    
    return `"${randomQuote}" - ${randomAuthor}`;
}

// Function to refresh the quote when button is clicked
async function refreshQuote() {
    const quoteElement = document.getElementById('quote');
    
    // Clear the current quote
    quoteElement.innerHTML = '';
    
    // Get a new quote from hardcoded list
    const newQuote = getRandomQuote();
    
    // Type the new quote with animation
    await typeWriterWithCursor(quoteElement, newQuote, 60);
    
    // Add the refresh button after typing is complete
    quoteElement.innerHTML += ' <span class="quote-refresh" onclick="refreshQuote()">↻</span>';
}

// SUDOPOWER ASCII art text
const sudopowerAscii = `     ███████╗██╗   ██╗██████╗  ██████╗     
     ██╔════╝██║   ██║██╔══██╗██╔═══██╗    
     ███████╗██║   ██║██║  ██║██║   ██║    
     ╚════██║██║   ██║██║  ██║██║   ██║    
     ███████║╚██████╔╝██████╔╝╚██████╔╝    
     ╚══════╝ ╚═════╝ ╚═════╝  ╚═════╝     
                                      
██████╗  ██████╗ ██╗    ██╗███████╗██████╗ 
██╔══██╗██╔═══██╗██║    ██║██╔════╝██╔══██╗
██████╔╝██║   ██║██║ █╗ ██║█████╗  ██████╔╝
██╔═══╝ ██║   ██║██║███╗██║██╔══╝  ██╔══██╗
██║     ╚██████╔╝╚███╔███╔╝███████╗██║  ██║
╚═╝      ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝`;

// Track if SUDOPOWER animation has been completed
let sudopowerAnimationCompleted = false;
let sudopowerAnimationInProgress = false;

// Function to animate SUDOPOWER ASCII art
async function animateSudopower() {
    const sudopowerElement = document.getElementById('sudopower-ascii');
    
    if (sudopowerElement && !sudopowerAnimationCompleted && !sudopowerAnimationInProgress) {
        // Mark animation as in progress to prevent interruptions
        sudopowerAnimationInProgress = true;
        
        // Clear any existing content
        sudopowerElement.innerHTML = '';
        
        // Start typing animation immediately
        await typeWriter(sudopowerElement, sudopowerAscii, 20);
        
        // Mark animation as completed
        sudopowerAnimationCompleted = true;
        sudopowerAnimationInProgress = false;
    } else if (sudopowerElement && sudopowerAnimationCompleted) {
        // If animation is already completed, just show the full ASCII art
        sudopowerElement.innerHTML = sudopowerAscii;
    }
}

// Function to show SUDOPOWER (for when void-message is displayed)
function showSudopower() {
    const sudopowerElement = document.getElementById('sudopower-ascii');
    if (sudopowerElement && sudopowerAnimationCompleted) {
        // If animation is completed, show the full ASCII art
        sudopowerElement.innerHTML = sudopowerAscii;
    }
}

// Main animation sequence
async function startAnimation() {
    const quoteElement = document.getElementById('quote');
    const introElement = document.getElementById('intro');
    const emailElement = document.getElementById('email');
    const terminalElement = document.querySelector('.terminal');
    
    // Get a random quote from hardcoded list
    const quote = getRandomQuote();
    
    // Type the quote first with following cursor
    await typeWriterWithCursor(quoteElement, quote, 60);
    
    // Add the refresh button after typing is complete
    quoteElement.innerHTML += ' <span class="quote-refresh" onclick="refreshQuote()">↻</span>';
    
    // Wait a moment, then type the intro with following cursor
    await new Promise(resolve => setTimeout(resolve, 1000));
    await typeWriterWithCursor(introElement, "I'm Kiran | I build tech", 80);
    
    // Wait a moment, then type the email with following cursor
    await new Promise(resolve => setTimeout(resolve, 800));
    await typeWriterWithCursor(emailElement, 'You can find me: ', 80);
    
    // Add the email link after typing
    emailElement.innerHTML += '<a href="mailto:nkirandroid@gmail.com">here</a>';
    
    // Add the final blinking cursor at the end
    emailElement.innerHTML += '<span class="cursor">|</span>';
    
    // Start the glow animation immediately
    terminalElement.classList.add('glow-active');
}

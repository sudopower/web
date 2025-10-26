// Function to highlight active tab based on current page
function highlightActiveTab() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        const href = tab.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            tab.classList.add('active');
        }
    });
}

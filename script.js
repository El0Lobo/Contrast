document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('main');
    const menu = document.querySelector('.menu');
    const hamburger = document.querySelector('.hamburger');
    const modal = document.getElementById('impressum-modal');
    const impressumButton = document.querySelector('.impressum-button');
    const closeButton = document.querySelector('.modal .close');
    let cursorEffectInstance = null; // Track cursor effect instance

    // Toggle menu visibility
    hamburger.addEventListener('click', () => {
        menu.classList.toggle('active');
    });

    // Modal functionality
    impressumButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Rainbow Cursor initialization
    function initializeRainbowCursor() {
        if (cursorEffectInstance && typeof cursorEffectInstance.destroy === 'function') {
            cursorEffectInstance.destroy();
        }

        cursorEffectInstance = new cursoreffects.rainbowCursor({
            colors: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'],
        });
    }

    function destroyRainbowCursor() {
        if (cursorEffectInstance && typeof cursorEffectInstance.destroy === 'function') {
            cursorEffectInstance.destroy();
            cursorEffectInstance = null;
        }
    }

    // Content Loading
    function loadContent(file) {
        fetch(`/static/content/${file}`)
            .then(response => {
                if (!response.ok) throw new Error(`File not found: ${file}`);
                return response.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newMainContent = doc.querySelector('main').innerHTML;
                main.innerHTML = newMainContent;

                // Apply Rainbow Cursor for Queer-Kneipe page
                if (file === 'Queer-Kneipe.html') {
                    initializeRainbowCursor();
                } else {
                    destroyRainbowCursor();
                }

                updateActiveLink(file);
            })
            .catch(error => {
                console.error(error);
                main.innerHTML = '<p>Content not found.</p>';
            });
    }

    // Update active menu link
    function updateActiveLink(activeFile) {
        menu.querySelectorAll('a').forEach(link => {
            link.style.textDecoration = 'none'; // Reset all links
            const linkFile = `${link.getAttribute('href').substring(1)}.html`;
            if (linkFile === activeFile) {
                link.style.textDecoration = 'underline'; // Underline the active link
            }
        });
    }

    // Menu Links Navigation
    const menuLinks = document.querySelectorAll('.menu a');

    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const file = `${link.getAttribute('href').substring(1)}.html`;
            history.pushState({ file }, '', link.getAttribute('href'));
            loadContent(file);

            // Close the menu after clicking a link in mobile view
            if (window.innerWidth <= 768) {
                menu.classList.remove('active');
            }
        });
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        const file = `${hash}.html` || 'home.html';
        loadContent(file);
    });

    // Initial Load
    const initialHash = window.location.hash.substring(1);
    const initialFile = initialHash ? `${initialHash}.html` : 'home.html';
    loadContent(initialFile);
});

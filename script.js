document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('main');
    const menu = document.querySelector('.menu');
    const hamburger = document.querySelector('.hamburger');
    const modal = document.getElementById('impressum-modal');
    const impressumButton = document.querySelector('.impressum-button');
    const closeButton = document.querySelector('.modal .close');
    let cursorEffectInstance = null; // Track cursor effect instance

    // Base path for content (adjust if necessary)
    const basePath = './static/content/';

    // Toggle menu visibility
    hamburger.addEventListener('click', () => {
        menu.classList.toggle('active');
    });

    // Modal functionality
    if (impressumButton) {
        impressumButton.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Initialize Rainbow Cursor Effect
    function initializeRainbowCursor() {
        if (cursorEffectInstance) {
            cursorEffectInstance.destroy();
        }

        cursorEffectInstance = new cursoreffects.rainbowCursor({
            colors: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'],
        });
    }

    // Destroy Rainbow Cursor Effect
    function destroyRainbowCursor() {
        if (cursorEffectInstance) {
            cursorEffectInstance.destroy();
            cursorEffectInstance = null;
        }
    }

    // Load content into the main section
    function loadContent(file) {
        fetch(`${basePath}${file}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: File not found (${file})`);
                }
                return response.text();
            })
            .then((html) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newMainContent = doc.querySelector('main')?.innerHTML;

                if (newMainContent) {
                    main.innerHTML = newMainContent;

                    // Initialize Rainbow Cursor for specific pages
                    if (file === 'Queer-Kneipe.html') {
                        initializeRainbowCursor();
                    } else {
                        destroyRainbowCursor();
                    }

                    updateActiveLink(file);
                } else {
                    throw new Error(`Main content not found in file: ${file}`);
                }
            })
            .catch((error) => {
                console.error(error);
                main.innerHTML = '<p>Content not found or invalid structure.</p>';
            });
    }

    // Update active link styling
    function updateActiveLink(activeFile) {
        menu.querySelectorAll('a').forEach((link) => {
            const linkFile = `${link.getAttribute('href').substring(1)}.html`;
            link.style.textDecoration = linkFile === activeFile ? 'underline' : 'none';
        });
    }

    // Handle menu link clicks
    const menuLinks = document.querySelectorAll('.menu a');
    menuLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const file = `${link.getAttribute('href').substring(1)}.html`;
            history.pushState({ file }, '', link.getAttribute('href'));
            loadContent(file);

            // Close the menu in mobile view after navigation
            if (window.innerWidth <= 768) {
                menu.classList.remove('active');
            }
        });
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', (event) => {
        const file = event.state?.file || 'home.html';
        loadContent(file);
    });

    // Initial content load
    const initialHash = window.location.hash.substring(1);
    const initialFile = initialHash ? `${initialHash}.html` : 'home.html';
    loadContent(initialFile);
});

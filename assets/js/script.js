document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('main');
    const menu = document.querySelector('.menu');
    const hamburger = document.querySelector('.hamburger');
    const modal = document.getElementById('impressum-modal');
    const impressumButton = document.querySelector('.impressum-button');
    const closeButton = document.querySelector('.modal .close');
    let cursorEffectInstance = null; // Track cursor effect instance

    // Base path for content (adjust if necessary)
    const basePath = './content/';

    // Function to attach animation end event listener
    function attachAnimationHandler() {
        const animatedText = document.getElementById('animated-text');
        if (animatedText) {
            animatedText.addEventListener('animationend', () => {
                animatedText.classList.remove('animate__animated', 'animate__hinge', 'animate__delay-2s', 'animate__slower');
                animatedText.classList.add('normal-text');
            });
            console.log('Animation handler attached.');
        } else {
            console.warn('Animated text element not found!');
        }
    }

    // Attach handler initially if `#animated-text` is already in the DOM
    attachAnimationHandler();

    // Observe the `main` element for changes
    const observer = new MutationObserver(() => {
        attachAnimationHandler(); // Recheck and attach handler if `#animated-text` is added
    });

    observer.observe(main, { childList: true, subtree: true });

    // Replace Instagram iframes with a privacy-friendly click-to-load notice.
    // This runs before the fetched content is inserted, so Instagram receives
    // no visitor data unless the visitor actively loads the embed.
    function protectInstagramEmbeds(doc) {
        doc.querySelectorAll('iframe[src*="instagram.com"]').forEach((iframe) => {
            const embedUrl = iframe.getAttribute('src');
            let profileUrl = 'https://www.instagram.com/contrast_kn/';

            try {
                const url = new URL(embedUrl);
                if (url.hostname === 'www.instagram.com' || url.hostname === 'instagram.com') {
                    profileUrl = `${url.origin}${url.pathname.replace(/\/embed\/?$/, '/')}`;
                }
            } catch (error) {
                console.warn('Invalid Instagram embed URL:', embedUrl);
                return;
            }

            const placeholder = doc.createElement('section');
            placeholder.className = 'instagram-consent';
            placeholder.dataset.embedUrl = embedUrl;
            placeholder.setAttribute('aria-label', 'Instagram-Inhalt');
            placeholder.innerHTML = `
                <div class="instagram-consent__mark" aria-hidden="true">◎</div>
                <h2>Instagram-Inhalt</h2>
                <p>Dieser Inhalt wird von Instagram bereitgestellt. Erst wenn du ihn lädst, wird eine Verbindung zu Meta hergestellt. Dabei können personenbezogene Daten, etwa deine IP-Adresse, übertragen und Cookies gesetzt werden.</p>
                <button type="button" class="instagram-consent__load">Instagram laden</button>
                <p class="instagram-consent__links">
                    <a href="${profileUrl}" target="_blank" rel="noopener noreferrer">Profil direkt öffnen</a>
                    <span aria-hidden="true">·</span>
                    <a href="https://privacycenter.instagram.com/policy/" target="_blank" rel="noopener noreferrer">Datenschutzhinweise von Instagram</a>
                </p>
            `;
            iframe.replaceWith(placeholder);
        });
    }

    function protectFacebookEmbeds(doc) {
        doc.querySelectorAll('iframe[src*="facebook.com/plugins/"]').forEach((iframe) => {
            const embedUrl = iframe.getAttribute('src');
            const container = iframe.closest('.facebook-container');
            if (!embedUrl || !container) return;

            const placeholder = doc.createElement('section');
            placeholder.className = 'instagram-consent facebook-consent';
            placeholder.dataset.embedUrl = embedUrl;
            placeholder.setAttribute('aria-label', 'Facebook-Inhalt');
            placeholder.innerHTML = `
                <div class="instagram-consent__mark" aria-hidden="true">f</div>
                <h2>Facebook-Inhalt</h2>
                <p>Dieser Inhalt wird von Facebook bereitgestellt. Erst wenn du ihn lädst, wird eine Verbindung zu Meta hergestellt. Dabei können personenbezogene Daten, etwa deine IP-Adresse, übertragen und Cookies gesetzt werden.</p>
                <button type="button" class="instagram-consent__load facebook-consent__load">Facebook laden</button>
                <p class="instagram-consent__links">
                    <a href="https://www.facebook.com/punkKneipeContrast/" target="_blank" rel="noopener noreferrer">Seite direkt öffnen</a>
                    <span aria-hidden="true">·</span>
                    <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Datenschutzhinweise von Facebook</a>
                </p>
            `;
            container.replaceWith(placeholder);
        });
    }

    function enableInstagramEmbeds() {
        main.querySelectorAll('.instagram-consent:not(.facebook-consent) .instagram-consent__load').forEach((button) => {
            button.addEventListener('click', () => {
                const placeholder = button.closest('.instagram-consent');
                const embedUrl = placeholder?.dataset.embedUrl;
                if (!placeholder || !embedUrl) return;

                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.className = 'instagram-embed';
                iframe.title = 'Instagram-Inhalt';
                iframe.loading = 'lazy';
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('allowtransparency', 'true');
                placeholder.replaceWith(iframe);
            });
        });
    }

    function enableFacebookEmbeds() {
        main.querySelectorAll('.facebook-consent__load').forEach((button) => {
            button.addEventListener('click', () => {
                const placeholder = button.closest('.facebook-consent');
                const embedUrl = placeholder?.dataset.embedUrl;
                if (!placeholder || !embedUrl) return;

                const container = document.createElement('div');
                container.className = 'facebook-container';

                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.title = 'Facebook-Inhalt';
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.loading = 'lazy';
                iframe.style.border = 'none';
                iframe.style.overflow = 'hidden';
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share');

                container.appendChild(iframe);
                placeholder.replaceWith(container);
            });
        });
    }

    // Toggle menu visibility
    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }

    // Modal functionality
    if (impressumButton && modal) {
        impressumButton.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    if (closeButton && modal) {
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

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
        const hash = window.location.hash.substring(1); // Get the current hash without the #
        const contentFile = file || `${hash}.html`; // Default to the hash if no file is provided
    
        if (!contentFile) {
            console.error('No file or hash specified for loading content.');
            return;
        }
    
        fetch(`${basePath}${contentFile}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: File not found (${contentFile})`);
                }
                return response.text();
            })
            .then((html) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                protectInstagramEmbeds(doc);
                protectFacebookEmbeds(doc);
                const newMainContent = doc.querySelector('main')?.innerHTML;
    
                if (newMainContent) {
                    main.innerHTML = newMainContent;
                    enableInstagramEmbeds();
                    enableFacebookEmbeds();
    
                    // Initialize Rainbow Cursor for specific pages
                    if (contentFile === 'Queer-Kneipe.html') {
                        initializeRainbowCursor();
                    } else {
                        destroyRainbowCursor();
                    }
    
                    updateActiveLink(contentFile);
                } else {
                    throw new Error(`Main content not found in file: ${contentFile}`);
                }
            })
            .catch((error) => {
                console.error(error);
                main.innerHTML = '<p>Content not found or invalid structure.</p>';
            });
    }
    
    // Listen for hash changes and load corresponding content
    window.addEventListener('hashchange', () => {
        loadContent(); // Automatically infer file from the hash
    });
    

    

    // Update active link styling
    function updateActiveLink(activeFile) {
        menu?.querySelectorAll('a').forEach((link) => {
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
                menu?.classList.remove('active');
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

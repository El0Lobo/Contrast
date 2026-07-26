document.addEventListener('DOMContentLoaded', () => {
    const scriptElement = document.querySelector('script[src$="assets/js/script.js"]');
    const siteRoot = scriptElement ? new URL('../../', scriptElement.src) : new URL('./', window.location.href);
    let baseElement = document.querySelector('base');

    if (!baseElement) {
        baseElement = document.createElement('base');
        document.head.prepend(baseElement);
    }
    baseElement.href = siteRoot.href;

    const main = document.querySelector('main');
    const menu = document.querySelector('.menu');
    const hamburger = document.querySelector('.hamburger');
    const modal = document.getElementById('impressum-modal');
    const impressumButton = document.querySelector('.impressum-button');
    const closeButton = document.querySelector('.modal .close');
    const validRoutes = new Set([
        'home', 'Queer-Kneipe', 'Das-Labor', 'Punk-Kneipe', 'Info-Kneipe',
        'Kunst-Kneipe', 'Spieleabend', 'mitglied', 'Kontakt'
    ]);
    let cursorEffectInstance = null; // Track cursor effect instance
    let modalTrigger = null;

    function routeFromLocation() {
        const queryRoute = new URLSearchParams(window.location.search).get('page');
        const legacyHashRoute = window.location.hash.substring(1);
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const pathRoute = decodeURIComponent(pathParts[pathParts.length - 1] || '');
        return [queryRoute, legacyHashRoute, pathRoute].find((route) => validRoutes.has(route)) || 'home';
    }

    function routeUrl(route) {
        return new URL(route === 'home' ? './' : `./${route}/`, siteRoot).href;
    }

    // Base path for content (adjust if necessary)
    const basePath = new URL('content/', siteRoot).href;

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

    function initializeVenueCarousel() {
        const carousel = main.querySelector('.venue-carousel');
        if (!carousel) return;

        const track = carousel.querySelector('.venue-carousel__track');
        const slides = Array.from(carousel.querySelectorAll('.venue-carousel__slide'));
        const previousButton = carousel.querySelector('.venue-carousel__arrow--prev');
        const nextButton = carousel.querySelector('.venue-carousel__arrow--next');
        const currentLabel = carousel.querySelector('.venue-carousel__current');
        const dotsContainer = carousel.querySelector('.venue-carousel__dots');
        let currentIndex = 0;
        let touchStartX = 0;

        const dots = slides.map((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'venue-carousel__dot';
            dot.setAttribute('aria-label', `Bild ${index + 1} anzeigen`);
            dot.addEventListener('click', () => showSlide(index));
            dotsContainer.appendChild(dot);
            return dot;
        });

        function showSlide(index) {
            currentIndex = (index + slides.length) % slides.length;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            currentLabel.textContent = String(currentIndex + 1).padStart(2, '0');

            slides.forEach((slide, slideIndex) => {
                slide.setAttribute('aria-hidden', slideIndex !== currentIndex ? 'true' : 'false');
            });

            dots.forEach((dot, dotIndex) => {
                const isCurrent = dotIndex === currentIndex;
                dot.classList.toggle('is-active', isCurrent);
                dot.setAttribute('aria-current', isCurrent ? 'true' : 'false');
            });
        }

        previousButton.addEventListener('click', () => showSlide(currentIndex - 1));
        nextButton.addEventListener('click', () => showSlide(currentIndex + 1));

        carousel.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') showSlide(currentIndex - 1);
            if (event.key === 'ArrowRight') showSlide(currentIndex + 1);
        });

        carousel.addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', (event) => {
            const distance = event.changedTouches[0].clientX - touchStartX;
            if (Math.abs(distance) < 50) return;
            showSlide(currentIndex + (distance < 0 ? 1 : -1));
        }, { passive: true });

        showSlide(0);
    }

    // Toggle menu visibility
    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            const isOpen = menu.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? 'Navigation schließen' : 'Navigation öffnen');
            hamburger.textContent = isOpen ? '×' : '☰';
        });
    }

    // Modal functionality
    function openModal() {
        modalTrigger = document.activeElement;
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        closeButton.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        modalTrigger?.focus();
    }

    if (impressumButton && modal) {
        impressumButton.addEventListener('click', openModal);
    }

    if (closeButton && modal) {
        closeButton.addEventListener('click', closeModal);

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeModal();
                return;
            }
            if (event.key !== 'Tab') return;

            const focusable = Array.from(modal.querySelectorAll(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
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
    function loadContent(file, moveFocus = false) {
        const contentFile = file || 'home.html';
    
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
                    initializeVenueCarousel();
    
                    // Initialize Rainbow Cursor for specific pages
                    if (contentFile === 'Queer-Kneipe.html') {
                        initializeRainbowCursor();
                    } else {
                        destroyRainbowCursor();
                    }
    
                    updateActiveLink(contentFile);
                    if (moveFocus) main.focus();
                } else {
                    throw new Error(`Main content not found in file: ${contentFile}`);
                }
            })
            .catch((error) => {
                console.error(error);
                main.innerHTML = '<p>Content not found or invalid structure.</p>';
            });
    }
    
    // Update active link styling
    function updateActiveLink(activeFile) {
        menu?.querySelectorAll('a').forEach((link) => {
            const isActive = `${link.dataset.route}.html` === activeFile;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    // Handle both persistent navigation and links inside dynamically loaded content.
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-route]');
        if (!link || !validRoutes.has(link.dataset.route)) return;

        event.preventDefault();
        const route = link.dataset.route;
        const file = `${route}.html`;
        history.pushState({ file }, '', routeUrl(route));
        loadContent(file, true);

        menu?.classList.remove('active');
        hamburger?.setAttribute('aria-expanded', 'false');
        hamburger?.setAttribute('aria-label', 'Navigation öffnen');
        if (hamburger) hamburger.textContent = '☰';
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', (event) => {
        const route = routeFromLocation();
        loadContent(event.state?.file || `${route}.html`, true);
    });

    // Initial content load
    const initialRoute = routeFromLocation();
    const initialFile = `${initialRoute}.html`;
    const oldQueryRoute = new URLSearchParams(window.location.search).get('page');
    const oldHashRoute = window.location.hash.substring(1);
    if (validRoutes.has(oldQueryRoute) || validRoutes.has(oldHashRoute)) {
        history.replaceState({ file: initialFile }, '', routeUrl(initialRoute));
    }
    loadContent(initialFile);
});

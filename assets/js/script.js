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
    const languageButtons = document.querySelectorAll('[data-language]');
    const browserLanguage = navigator.languages?.[0] || navigator.language || 'en';
    let currentLanguage = localStorage.getItem('contrast-language')
        || (browserLanguage.toLowerCase().startsWith('de') ? 'de' : 'en');
    const validRoutes = new Set([
        'home', 'Queer-Kneipe', 'Das-Labor', 'Punk-Kneipe', 'Info-Kneipe',
        'Kunst-Kneipe', 'Spieleabend', 'mitglied', 'Kontakt'
    ]);
    const routeMetadata = {
      en: {
        home: {
            title: 'Contrast Konstanz | Alternative Music, Art & Culture',
            description: 'Contrast is a self-managed youth club in Konstanz for alternative music, art, culture and an open community.',
            image: 'assets/images/venue/contrast-venue-01.jpg'
        },
        'Queer-Kneipe': {
            title: 'Queer Night in Konstanz | Contrast',
            description: 'Queer Night at Contrast Konstanz is an open, safer meeting place with music, conversation and community every Monday.',
            image: 'assets/icons/events/queer-kneipe.png'
        },
        'Das-Labor': {
            title: 'The Lab – experimental music in Konstanz | Contrast',
            description: 'Electronic sounds, experimental music and creative performances every Tuesday at Contrast Konstanz.',
            image: 'assets/icons/events/das-labor.png'
        },
        'Punk-Kneipe': {
            title: 'Punk Night in Konstanz | Contrast',
            description: 'Punk, community and affordable drinks every Thursday at Punk Night in Contrast Konstanz.',
            image: 'assets/icons/events/punk-kneipe.png'
        },
        'Info-Kneipe': {
            title: 'Info Night – Talks & Discussion | Contrast Konstanz',
            description: 'Talks and discussions about politics, society, the environment and culture at Info Night in Contrast Konstanz.',
            image: 'assets/icons/events/info-kneipe.png'
        },
        'Kunst-Kneipe': {
            title: 'Art Night in Konstanz | Contrast',
            description: 'Experience art, get creative together and meet local artists at Art Night in Contrast Konstanz.',
            image: 'assets/icons/events/kunstkneipe2.png'
        },
        Spieleabend: {
            title: 'Games Night in Konstanz | Contrast',
            description: 'Board games, card games and an open community at Games Night in Contrast Konstanz.',
            image: 'assets/icons/events/spieleabend.png'
        },
        mitglied: {
            title: 'Become a Member | Contrast Konstanz',
            description: 'Become a Contrast member and help shape alternative music, art, culture and community events in Konstanz.',
            image: 'assets/images/membership-poster.png'
        },
        Kontakt: {
            title: 'Contact, Directions & Opening Hours | Contrast Konstanz',
            description: 'Address, directions, opening hours and booking contact for Contrast at Joseph-Belli-Weg 11 in Konstanz.',
            image: 'assets/images/map.png'
        }
      },
      de: {
        home: { title: 'Contrast Konstanz | Alternative Musik, Kunst & Kultur', description: 'Das Contrast ist ein selbstverwalteter Jugendclub in Konstanz für alternative Musik, Kunst, Kultur und eine offene Gemeinschaft.', image: 'assets/images/venue/contrast-venue-01.jpg' },
        'Queer-Kneipe': { title: 'Queer-Kneipe in Konstanz | Contrast', description: 'Die Queer-Kneipe im Contrast Konstanz: ein offener, sicherer Treffpunkt mit Musik, Gesprächen und Gemeinschaft am Montagabend.', image: 'assets/icons/events/queer-kneipe.png' },
        'Das-Labor': { title: 'Das Labor – experimentelle Musik in Konstanz | Contrast', description: 'Elektronische Klänge, experimentelle Musik und kreative Performances: Entdecke Das Labor jeden Dienstag im Contrast Konstanz.', image: 'assets/icons/events/das-labor.png' },
        'Punk-Kneipe': { title: 'Punk-Kneipe in Konstanz | Contrast', description: 'Punk, Gemeinschaft und erschwingliche Getränke: Die Punk-Kneipe findet jeden Donnerstag im Contrast Konstanz statt.', image: 'assets/icons/events/punk-kneipe.png' },
        'Info-Kneipe': { title: 'Info-Kneipe – Vorträge & Austausch | Contrast Konstanz', description: 'Vorträge, Diskussionen und Austausch zu Politik, Gesellschaft, Umwelt und Kultur bei der Info-Kneipe im Contrast Konstanz.', image: 'assets/icons/events/info-kneipe.png' },
        'Kunst-Kneipe': { title: 'Kunst-Kneipe in Konstanz | Contrast', description: 'Kunst erleben, gemeinsam kreativ werden und lokale Künstler*innen treffen bei der Kunst-Kneipe im Contrast Konstanz.', image: 'assets/icons/events/kunstkneipe2.png' },
        Spieleabend: { title: 'Spieleabend in Konstanz | Contrast', description: 'Brettspiele, Kartenspiele und eine offene Gemeinschaft: Informiere dich über den nächsten Spieleabend im Contrast Konstanz.', image: 'assets/icons/events/spieleabend.png' },
        mitglied: { title: 'Mitglied werden | Contrast Konstanz', description: 'Werde Mitglied im Contrast und gestalte alternative Musik, Kunst, Kultur und gemeinschaftliche Veranstaltungen in Konstanz mit.', image: 'assets/images/membership-poster.png' },
        Kontakt: { title: 'Kontakt, Anfahrt & Öffnungszeiten | Contrast Konstanz', description: 'Adresse, Anfahrt, Öffnungszeiten und Booking-Kontakt des Contrast am Joseph-Belli-Weg 11 in Konstanz.', image: 'assets/images/map.png' }
      }
    };
    let cursorEffectInstance = null; // Track cursor effect instance
    let modalTrigger = null;
    let imageModalTrigger = null;

    const imageModal = document.createElement('div');
    imageModal.className = 'image-modal';
    imageModal.setAttribute('role', 'dialog');
    imageModal.setAttribute('aria-modal', 'true');
    imageModal.setAttribute('aria-label', 'Image view');
    imageModal.setAttribute('aria-hidden', 'true');
    imageModal.innerHTML = `
        <div class="image-modal__content">
            <button class="image-modal__close" type="button" aria-label="Close image view">&times;</button>
            <img class="image-modal__image" src="" alt="">
            <p class="image-modal__caption"></p>
        </div>
    `;
    document.body.appendChild(imageModal);

    const imageModalImage = imageModal.querySelector('.image-modal__image');
    const imageModalCaption = imageModal.querySelector('.image-modal__caption');
    const imageModalClose = imageModal.querySelector('.image-modal__close');

    function enhanceZoomableImages() {
        main.querySelectorAll('img:not(.logo2)').forEach((image) => {
            image.classList.add('is-zoomable');
            image.setAttribute('tabindex', '0');
            image.setAttribute('role', 'button');
            image.setAttribute('aria-label', currentLanguage === 'de'
                ? `${image.alt || 'Bild'} vergrößern`
                : `Enlarge ${image.alt || 'image'}`);
        });
    }

    function openImageModal(image) {
        imageModalTrigger = image;
        imageModalImage.src = image.currentSrc || image.src;
        imageModalImage.alt = image.alt || '';
        imageModalCaption.textContent = image.alt || '';
        imageModalCaption.hidden = !image.alt;
        imageModal.classList.add('is-open');
        imageModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        imageModalClose.focus();
    }

    function closeImageModal() {
        if (!imageModal.classList.contains('is-open')) return;
        imageModal.classList.remove('is-open');
        imageModal.setAttribute('aria-hidden', 'true');
        imageModalImage.src = '';
        document.body.classList.remove('modal-open');
        imageModalTrigger?.focus();
        imageModalTrigger = null;
    }

    main.addEventListener('click', (event) => {
        const image = event.target.closest('img.is-zoomable');
        if (!image) return;
        event.preventDefault();
        openImageModal(image);
    });

    main.addEventListener('keydown', (event) => {
        const image = event.target.closest('img.is-zoomable');
        if (!image || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        openImageModal(image);
    });

    imageModalClose.addEventListener('click', closeImageModal);
    imageModal.addEventListener('click', (event) => {
        if (event.target === imageModal) closeImageModal();
    });
    imageModal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeImageModal();
        if (event.key === 'Tab') {
            event.preventDefault();
            imageModalClose.focus();
        }
    });

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

    function updatePageMetadata(route) {
        const metadata = routeMetadata[currentLanguage][route] || routeMetadata[currentLanguage].home;
        const canonicalUrl = routeUrl(route);
        const imageUrl = new URL(metadata.image, siteRoot).href;
        document.title = metadata.title;

        const values = {
            'meta[name="description"]': metadata.description,
            'meta[property="og:title"]': metadata.title,
            'meta[property="og:description"]': metadata.description,
            'meta[property="og:url"]': canonicalUrl,
            'meta[property="og:image"]': imageUrl
        };

        Object.entries(values).forEach(([selector, content]) => {
            document.querySelector(selector)?.setAttribute('content', content);
        });
        document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    }

    const pagesPath = new URL('pages/', siteRoot).href;
    const chromeCopy = {
        en: {
            skip: 'Skip to content',
            nav: ['Home', 'Queer Night', 'The Lab', 'Punk Night', 'Info Night', 'Art Night', 'Games Night', 'Become a member', 'Contact'],
            navLabel: 'Main navigation',
            openNav: 'Open navigation',
            closeNav: 'Close navigation',
            legal: 'Legal notice',
            closeLegal: 'Close legal notice',
            imageView: 'Image view',
            closeImage: 'Close image view',
            notFound: 'Content not found or invalid structure.'
        },
        de: {
            skip: 'Zum Inhalt springen',
            nav: ['Home', 'Queer-Kneipe', 'Das Labor', 'Punk-Kneipe', 'Info-Kneipe', 'Kunst-Kneipe', 'Spieleabend', 'Mitglied werden', 'Kontakt'],
            navLabel: 'Hauptnavigation',
            openNav: 'Navigation öffnen',
            closeNav: 'Navigation schließen',
            legal: 'Impressum',
            closeLegal: 'Impressum schließen',
            imageView: 'Bildansicht',
            closeImage: 'Bildansicht schließen',
            notFound: 'Inhalt nicht gefunden oder ungültig.'
        }
    };
    const legalNotice = document.querySelector('.impressum');
    const englishLegalMarkup = legalNotice?.innerHTML || '';
    let germanLegalMarkup = '';

    async function updateLegalNotice() {
        if (!legalNotice) return;
        if (currentLanguage === 'en') {
            legalNotice.innerHTML = englishLegalMarkup;
            return;
        }
        if (!germanLegalMarkup) {
            try {
                const response = await fetch(`${pagesPath}de/legal.html`);
                if (!response.ok) throw new Error(`Error ${response.status}`);
                const documentFragment = new DOMParser().parseFromString(await response.text(), 'text/html');
                germanLegalMarkup = documentFragment.querySelector('.impressum')?.innerHTML || '';
            } catch (error) {
                console.error('Could not load the German legal notice:', error);
            }
        }
        if (germanLegalMarkup && currentLanguage === 'de') {
            legalNotice.innerHTML = germanLegalMarkup;
        }
    }

    function applyChromeLanguage() {
        const copy = chromeCopy[currentLanguage];
        document.documentElement.lang = currentLanguage;
        document.querySelector('meta[property="og:locale"]')?.setAttribute('content', currentLanguage === 'de' ? 'de_DE' : 'en_GB');
        document.querySelector('.skip-link').textContent = copy.skip;
        document.querySelector('#site-navigation').setAttribute('aria-label', copy.navLabel);
        menu?.querySelectorAll('a').forEach((link, index) => { link.textContent = copy.nav[index]; });
        document.querySelector('.impressum-button').textContent = copy.legal;
        document.querySelector('.modal .close').setAttribute('aria-label', copy.closeLegal);
        document.querySelector('.image-modal').setAttribute('aria-label', copy.imageView);
        document.querySelector('.image-modal__close').setAttribute('aria-label', copy.closeImage);
        const isOpen = menu?.classList.contains('active');
        hamburger?.setAttribute('aria-label', isOpen ? copy.closeNav : copy.openNav);
        languageButtons.forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage));
        });
        updateLegalNotice();
    }

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
            const isGerman = currentLanguage === 'de';
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
            placeholder.setAttribute('aria-label', isGerman ? 'Instagram-Inhalt' : 'Instagram content');
            placeholder.innerHTML = `
                <div class="instagram-consent__mark" aria-hidden="true">◎</div>
                <h2>${isGerman ? 'Instagram-Inhalt' : 'Instagram content'}</h2>
                <p>${isGerman ? 'Dieser Inhalt wird von Instagram bereitgestellt. Erst wenn du ihn lädst, wird eine Verbindung zu Meta hergestellt. Dabei können personenbezogene Daten, etwa deine IP-Adresse, übertragen und Cookies gesetzt werden.' : 'This content is provided by Instagram. A connection to Meta is made only when you load it. Personal data, such as your IP address, may be transferred and cookies may be set.'}</p>
                <button type="button" class="instagram-consent__load">${isGerman ? 'Instagram laden' : 'Load Instagram'}</button>
                <p class="instagram-consent__links">
                    <a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${isGerman ? 'Profil direkt öffnen' : 'Open profile directly'}</a>
                    <span aria-hidden="true">·</span>
                    <a href="https://privacycenter.instagram.com/policy/" target="_blank" rel="noopener noreferrer">${isGerman ? 'Datenschutzhinweise von Instagram' : 'Instagram privacy policy'}</a>
                </p>
            `;
            iframe.replaceWith(placeholder);
        });
    }

    function protectFacebookEmbeds(doc) {
        doc.querySelectorAll('iframe[src*="facebook.com/plugins/"]').forEach((iframe) => {
            const isGerman = currentLanguage === 'de';
            const embedUrl = iframe.getAttribute('src');
            const container = iframe.closest('.facebook-container');
            if (!embedUrl || !container) return;

            const placeholder = doc.createElement('section');
            placeholder.className = 'instagram-consent facebook-consent';
            placeholder.dataset.embedUrl = embedUrl;
            placeholder.setAttribute('aria-label', isGerman ? 'Facebook-Inhalt' : 'Facebook content');
            placeholder.innerHTML = `
                <div class="instagram-consent__mark" aria-hidden="true">f</div>
                <h2>${isGerman ? 'Facebook-Inhalt' : 'Facebook content'}</h2>
                <p>${isGerman ? 'Dieser Inhalt wird von Facebook bereitgestellt. Erst wenn du ihn lädst, wird eine Verbindung zu Meta hergestellt. Dabei können personenbezogene Daten, etwa deine IP-Adresse, übertragen und Cookies gesetzt werden.' : 'This content is provided by Facebook. A connection to Meta is made only when you load it. Personal data, such as your IP address, may be transferred and cookies may be set.'}</p>
                <button type="button" class="instagram-consent__load facebook-consent__load">${isGerman ? 'Facebook laden' : 'Load Facebook'}</button>
                <p class="instagram-consent__links">
                    <a href="https://www.facebook.com/punkKneipeContrast/" target="_blank" rel="noopener noreferrer">${isGerman ? 'Seite direkt öffnen' : 'Open page directly'}</a>
                    <span aria-hidden="true">·</span>
                    <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">${isGerman ? 'Datenschutzhinweise von Facebook' : 'Facebook privacy policy'}</a>
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
                iframe.title = currentLanguage === 'de' ? 'Instagram-Inhalt' : 'Instagram content';
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
                iframe.title = currentLanguage === 'de' ? 'Facebook-Inhalt' : 'Facebook content';
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
            dot.setAttribute('aria-label', currentLanguage === 'de' ? `Bild ${index + 1} anzeigen` : `Show image ${index + 1}`);
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
            hamburger.setAttribute('aria-label', isOpen ? chromeCopy[currentLanguage].closeNav : chromeCopy[currentLanguage].openNav);
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
        const route = contentFile.replace(/\.html$/, '');
    
        if (!contentFile) {
            console.error('No file or hash specified for loading content.');
            return;
        }
    
        const contentUrl = currentLanguage === 'de'
            ? `${pagesPath}de/${contentFile}`
            : (contentFile === 'home.html' ? siteRoot.href : `${pagesPath}${contentFile}`);

        fetch(contentUrl)
            .then((response) => {
                if (!response.ok) {
                    return fetch(routeUrl(route)).then((routeResponse) => {
                        if (!routeResponse.ok) {
                            throw new Error(`Error ${response.status}: File not found (${contentUrl})`);
                        }
                        return routeResponse.text();
                    });
                }
                return response.text();
            })
            .then((html) => {
                const pageDocument = new DOMParser().parseFromString(html, 'text/html');
                protectInstagramEmbeds(pageDocument);
                protectFacebookEmbeds(pageDocument);
                const newMainContent = pageDocument.querySelector('main')?.innerHTML;
    
                if (newMainContent) {
                    main.innerHTML = newMainContent;
                    main.dataset.route = route;
                    updatePageMetadata(contentFile.replace(/\.html$/, ''));
                    enhanceZoomableImages();
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
                main.innerHTML = `<p>${chromeCopy[currentLanguage].notFound}</p>`;
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
        hamburger?.setAttribute('aria-label', chromeCopy[currentLanguage].openNav);
        if (hamburger) hamburger.textContent = '☰';
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', (event) => {
        const route = routeFromLocation();
        loadContent(event.state?.file || `${route}.html`, true);
    });

    languageButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const language = button.dataset.language;
            if (language === currentLanguage) return;
            currentLanguage = language;
            localStorage.setItem('contrast-language', language);
            applyChromeLanguage();
            loadContent(`${main.dataset.route || routeFromLocation()}.html`, true);
        });
    });

    // Initial content load
    applyChromeLanguage();
    const initialRoute = routeFromLocation();
    const initialFile = `${initialRoute}.html`;
    const oldQueryRoute = new URLSearchParams(window.location.search).get('page');
    const oldHashRoute = window.location.hash.substring(1);
    if (validRoutes.has(oldQueryRoute) || validRoutes.has(oldHashRoute)) {
        history.replaceState({ file: initialFile }, '', routeUrl(initialRoute));
    }
    if (currentLanguage === 'en' && main.dataset.route === initialRoute) {
        protectInstagramEmbeds(document);
        protectFacebookEmbeds(document);
        enhanceZoomableImages();
        enableInstagramEmbeds();
        enableFacebookEmbeds();
        initializeVenueCarousel();
        updateActiveLink(initialFile);
        updatePageMetadata(initialRoute);
        if (initialRoute === 'Queer-Kneipe') initializeRainbowCursor();
    } else {
        loadContent(initialFile);
    }
});

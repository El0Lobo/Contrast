document.addEventListener('DOMContentLoaded', () => {
    const scriptElement = document.querySelector('script[src$="assets/js/script.js"]');
    let baseElement = document.querySelector('base');
    // Generated subpages carry their own relative <base>. Keep it: replacing it
    // with a root-relative URL breaks GitHub Pages project sites (/Contrast/...).
    const siteRoot = baseElement
        ? new URL(baseElement.href)
        : (scriptElement ? new URL('../../', scriptElement.src) : new URL('./', window.location.href));

    if (!baseElement) {
        baseElement = document.createElement('base');
        baseElement.href = siteRoot.href;
        document.head.prepend(baseElement);
    }

    const main = document.querySelector('main');
    const menu = document.querySelector('.menu');
    const hamburger = document.querySelector('.hamburger');
    const modal = document.getElementById('impressum-modal');
    const impressumButton = document.querySelector('.impressum-button');
    const closeButton = document.querySelector('.modal .close');
    const languageButtons = document.querySelectorAll('[data-language]');
    const staticLocale = document.documentElement.dataset.staticLocale;
    const browserLanguage = navigator.languages?.[0] || navigator.language || 'en';
    let currentLanguage = staticLocale || (browserLanguage.toLowerCase().startsWith('de') ? 'de' : 'en');
    const validRoutes = new Set([
        'home', 'Queer-Kneipe', /* 'Das-Labor', calendar-only */ 'Punk-Kneipe', 'Info-Kneipe',
        'Kunst-Kneipe', 'Spieleabend', 'mitglied', 'Kontakt', 'About', 'Archiv', 'events'
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
            image: 'assets/icons/events/queer-kneipe.webp'
        },
        /* 'Das-Labor': {
            title: 'The Lab – experimental music in Konstanz | Contrast',
            description: 'Electronic sounds, experimental music and creative performances every Tuesday at Contrast Konstanz.',
            image: 'assets/icons/events/das-labor.webp'
        }, */
        'Punk-Kneipe': {
            title: 'Punk Night in Konstanz | Contrast',
            description: 'Punk, community and affordable drinks every Thursday at Punk Night in Contrast Konstanz.',
            image: 'assets/icons/events/punk-kneipe.webp'
        },
        'Info-Kneipe': {
            title: 'Info Night – Talks & Discussion | Contrast Konstanz',
            description: 'Talks and discussions about politics, society, the environment and culture at Info Night in Contrast Konstanz.',
            image: 'assets/icons/events/info-kneipe.webp'
        },
        'Kunst-Kneipe': {
            title: 'Art Night in Konstanz | Contrast',
            description: 'Experience art, get creative together and meet local artists at Art Night in Contrast Konstanz.',
            image: 'assets/icons/events/kunstkneipe.png'
        },
        Spieleabend: {
            title: 'Games Night in Konstanz | Contrast',
            description: 'Board games, card games and an open community at Games Night in Contrast Konstanz.',
            image: 'assets/icons/events/spieleabend.webp'
        },
        mitglied: {
            title: 'Become a Member | Contrast Konstanz',
            description: 'Become a Contrast member and help shape alternative music, art, culture and community events in Konstanz.',
            image: 'assets/images/membership-poster.webp'
        },
        Kontakt: {
            title: 'Contact, Directions & Opening Hours | Contrast Konstanz',
            description: 'Address, directions, opening hours and booking contact for Contrast at Joseph-Belli-Weg 11 in Konstanz.',
            image: 'assets/images/map.webp'
        }
        ,About: {
            title: 'About Contrast Konstanz | Community, Culture & Club',
            description: 'Learn about Contrast, the self-managed youth club in Konstanz for alternative culture, music and community.',
            image: 'assets/images/venue/contrast-venue-06.jpg'
        },
        Archiv: {
            title: 'Band archive | Contrast Konstanz',
            description: 'Bands documented at Mauerblümchen, Outback and Contrast in Konstanz.',
            image: 'assets/images/venue/contrast-venue-06.jpg'
        },
        events: {
            title: 'Programme & events | Contrast Konstanz',
            description: 'Upcoming and past events at Contrast Konstanz.',
            image: 'assets/images/venue/contrast-venue-04.jpg'
        }
      },
      de: {
        home: { title: 'Contrast Konstanz | Alternative Musik, Kunst & Kultur', description: 'Das Contrast ist ein selbstverwalteter Jugendclub in Konstanz für alternative Musik, Kunst, Kultur und eine offene Gemeinschaft.', image: 'assets/images/venue/contrast-venue-01.jpg' },
        'Queer-Kneipe': { title: 'Queer-Kneipe in Konstanz | Contrast', description: 'Die Queer-Kneipe im Contrast Konstanz: ein offener, sicherer Treffpunkt mit Musik, Gesprächen und Gemeinschaft am Montagabend.', image: 'assets/icons/events/queer-kneipe.webp' },
        /* 'Das-Labor': { title: 'Das Labor – experimentelle Musik in Konstanz | Contrast', description: 'Elektronische Klänge, experimentelle Musik und kreative Performances: Entdecke Das Labor jeden Dienstag im Contrast Konstanz.', image: 'assets/icons/events/das-labor.webp' }, */
        'Punk-Kneipe': { title: 'Punk-Kneipe in Konstanz | Contrast', description: 'Punk, Gemeinschaft und erschwingliche Getränke: Die Punk-Kneipe findet jeden Donnerstag im Contrast Konstanz statt.', image: 'assets/icons/events/punk-kneipe.webp' },
        'Info-Kneipe': { title: 'Info-Kneipe – Vorträge & Austausch | Contrast Konstanz', description: 'Vorträge, Diskussionen und Austausch zu Politik, Gesellschaft, Umwelt und Kultur bei der Info-Kneipe im Contrast Konstanz.', image: 'assets/icons/events/info-kneipe.webp' },
        'Kunst-Kneipe': { title: 'Kunst-Kneipe in Konstanz | Contrast', description: 'Kunst erleben, gemeinsam kreativ werden und lokale Künstler*innen treffen bei der Kunst-Kneipe im Contrast Konstanz.', image: 'assets/icons/events/kunstkneipe.png' },
        Spieleabend: { title: 'Spieleabend in Konstanz | Contrast', description: 'Brettspiele, Kartenspiele und eine offene Gemeinschaft: Informiere dich über den nächsten Spieleabend im Contrast Konstanz.', image: 'assets/icons/events/spieleabend.webp' },
        mitglied: { title: 'Mitglied werden | Contrast Konstanz', description: 'Werde Mitglied im Contrast und gestalte alternative Musik, Kunst, Kultur und gemeinschaftliche Veranstaltungen in Konstanz mit.', image: 'assets/images/membership-poster.webp' },
        Kontakt: { title: 'Kontakt, Anfahrt & Öffnungszeiten | Contrast Konstanz', description: 'Adresse, Anfahrt, Öffnungszeiten und Booking-Kontakt des Contrast am Joseph-Belli-Weg 11 in Konstanz.', image: 'assets/images/map.webp' },
        About: { title: 'Über das Contrast Konstanz | Gemeinschaft, Kultur & Club', description: 'Erfahre mehr über das Contrast, den selbstverwalteten Jugendclub für alternative Kultur, Musik und Gemeinschaft in Konstanz.', image: 'assets/images/venue/contrast-venue-06.jpg' },
        Archiv: { title: 'Band-Archiv | Contrast Konstanz', description: 'Bands aus Mauerblümchen, Outback und Contrast in Konstanz.', image: 'assets/images/venue/contrast-venue-06.jpg' },
        events: { title: 'Programm & Veranstaltungen | Contrast Konstanz', description: 'Kommende und vergangene Veranstaltungen im Contrast Konstanz.', image: 'assets/images/venue/contrast-venue-04.jpg' }
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
            nav: { home: 'Home', events: 'Events', About: 'About', 'Queer-Kneipe': 'Queer Night', 'Punk-Kneipe': 'Punk Night', 'Info-Kneipe': 'Info Night', 'Kunst-Kneipe': 'Art Night', Spieleabend: 'Games Night', mitglied: 'Become a member', Kontakt: 'Contact' },
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
            nav: { home: 'Home', events: 'Programm', About: 'Über uns', 'Queer-Kneipe': 'Queer-Kneipe', 'Punk-Kneipe': 'Punk-Kneipe', 'Info-Kneipe': 'Info-Kneipe', 'Kunst-Kneipe': 'Kunst-Kneipe', Spieleabend: 'Spieleabend', mitglied: 'Mitglied werden', Kontakt: 'Kontakt' },
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
        menu?.querySelectorAll('a').forEach((link) => { link.textContent = copy.nav[link.dataset.route] || link.textContent; });
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

    function initializeBandArchive() {
        const archive = main.querySelector('.history-archive');
        const search = archive?.querySelector('[data-history-search]');
        const sort = archive?.querySelector('[data-history-sort]');
        if (!archive || !search || !sort || archive.dataset.archiveReady) return;
        archive.dataset.archiveReady = 'true';
        const entries = [...archive.querySelectorAll('[data-history-band]')];
        const empty = archive.querySelector('[data-history-empty]');

        const dateValue = (value) => {
            const exact = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            if (exact) return Date.UTC(Number(exact[3]), Number(exact[2]) - 1, Number(exact[1]));
            const year = value.match(/(?:19|20)\d{2}/);
            return year ? Date.UTC(Number(year[0]), 0, 1) : null;
        };

        const update = () => {
            const term = search.value.trim().toLocaleLowerCase();
            let visibleTotal = 0;
            archive.querySelectorAll('.history-archive__era').forEach((group) => {
                const list = group.querySelector('ul');
                const groupEntries = [...list.querySelectorAll('[data-history-band]')];
                groupEntries.sort((a, b) => {
                    if (sort.value === 'name') return a.dataset.name.localeCompare(b.dataset.name, currentLanguage);
                    const aDate = dateValue(a.dataset.date);
                    const bDate = dateValue(b.dataset.date);
                    if (aDate === null && bDate === null) return a.dataset.name.localeCompare(b.dataset.name, currentLanguage);
                    if (aDate === null) return 1;
                    if (bDate === null) return -1;
                    return sort.value === 'date-asc' ? aDate - bDate : bDate - aDate;
                });
                groupEntries.forEach((entry) => list.append(entry));
                const visible = groupEntries.filter((entry) => {
                    const matches = !term || entry.dataset.name.includes(term);
                    entry.hidden = !matches;
                    return matches;
                });
                group.hidden = visible.length === 0;
                const count = group.querySelector('[data-history-count]');
                if (count) count.textContent = visible.length;
                if (term && visible.length) group.open = true;
                visibleTotal += visible.length;
            });
            empty.hidden = visibleTotal !== 0;
        };

        search.addEventListener('input', update);
        sort.addEventListener('change', update);
        update();
    }

    function initializeEventsArchive() {
        const eventsPage = main.querySelector('[data-events-search]')?.closest('main');
        const search = eventsPage?.querySelector('[data-events-search]');
        const includePast = eventsPage?.querySelector('[data-events-include-past]');
        const archive = eventsPage?.querySelector('.events-overview--past');
        const entries = eventsPage ? [...eventsPage.querySelectorAll('[data-events-item]')] : [];
        const empty = eventsPage?.querySelector('[data-events-empty]');
        const disclosure = archive?.querySelector('details');
        if (!eventsPage || !search || !includePast || !archive || eventsPage.dataset.eventsReady) return;
        eventsPage.dataset.eventsReady = 'true';

        const update = () => {
            const normalise = (value = '') => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const term = normalise(search.value.trim());
            let matches = 0;
            entries.forEach((entry) => {
                const searchable = !entry.hasAttribute('data-events-past-item') || includePast.checked;
                const visible = !term || (searchable && normalise(entry.dataset.eventsIndex || '').includes(term));
                entry.hidden = !visible;
                if (visible) matches += 1;
            });
            empty.hidden = !term || matches !== 0;
            archive.hidden = Boolean(term && !includePast.checked);
            if (term && includePast.checked) disclosure.open = true;
        };

        search.addEventListener('input', update);
        includePast.addEventListener('change', update);
        update();
    }

    function initializeCalendarDownload() {
        const picker = main.querySelector('[data-calendar-picker]');
        if (!picker || picker.dataset.calendarReady) return;
        picker.dataset.calendarReady = 'true';

        const escapeIcs = (value = '') => String(value)
            .replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')
            .replace(/,/g, '\\,').replace(/;/g, '\\;');
        const icsTime = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const icsFor = (events) => {
            const entries = events.map((event) => [
                'BEGIN:VEVENT',
                `UID:${escapeIcs(event.id)}`,
                `DTSTART:${icsTime(event.startDate)}`,
                `DTEND:${icsTime(event.endDate || event.startDate)}`,
                `SUMMARY:${escapeIcs(event.title)}`,
                `DESCRIPTION:${escapeIcs(event.description || '')}`,
                `LOCATION:${escapeIcs('Contrast, Joseph-Belli-Weg 11, 78467 Konstanz, Germany')}`,
                `URL:${escapeIcs(event.url)}`,
                event.categories?.length ? `CATEGORIES:${event.categories.map(escapeIcs).join(',')}` : '',
                'END:VEVENT'
            ].filter(Boolean).join('\r\n')).join('\r\n');
            return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Contrast Konstanz//Programme//EN\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:Contrast programme\r\n${entries}\r\nEND:VCALENDAR\r\n`;
        };

        picker.addEventListener('submit', async (event) => {
            event.preventDefault();
            const chosen = new Set([...picker.querySelectorAll('input:checked')].map((input) => input.value));
            if (!chosen.size) return;
            try {
                const response = await fetch(new URL('events.json', siteRoot.href));
                if (!response.ok) throw new Error('events.json unavailable');
                const data = await response.json();
                const selected = data.events.filter((entry) => entry.categories?.some((category) => chosen.has(category)));
                const blob = new Blob([icsFor(selected)], { type: 'text/calendar;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'contrast-programm.ics';
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            } catch (error) {
                window.location.assign(new URL('events.ics', siteRoot.href));
            }
        });
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
        if (typeof cursoreffects === 'undefined') return;
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
                    initializeBandArchive();
                    initializeEventsArchive();
                    initializeCalendarDownload();
                    positionHomeProgramme();
                    initializeProgrammeControls();
    
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

    function positionHomeProgramme() {
        if (main.dataset.route !== 'home') return;
        const intro = main.querySelector('.home-intro');
        const programme = main.querySelector('.program');
        if (intro && programme) intro.before(programme);
    }

    async function initializeProgrammeControls() {
        const programme = main.querySelector('.program');
        if (!programme || programme.dataset.calendarReady) return;
        programme.dataset.calendarReady = 'true';
        const heading = programme.querySelector('#program-heading');
        const rows = programme.querySelector('.program__rows');
        const de = currentLanguage === 'de';
        const copy = de
            ? { closed: 'Geschlossen', week: 'Woche', month: 'Monat', previous: 'Vorheriger Zeitraum', next: 'Nächster Zeitraum', switchView: 'Ansicht wechseln', entry: 'Eintritt', closure: 'Geschlossen', closureFrom: 'Von', closureUntil: 'bis', closureDays: 'Tage', closureDay: 'Tag', closeNotice: 'Hinweis schließen', closureUntilLabel: 'bis', closureReturn: 'Wir freuen uns, euch danach wiederzusehen.' }
            : { closed: 'Closed', week: 'Week', month: 'Month', previous: 'Previous period', next: 'Next period', switchView: 'Change view', entry: 'Entry', closure: 'Closed', closureFrom: 'From', closureUntil: 'to', closureDays: 'days', closureDay: 'day', closeNotice: 'Close notice', closureUntilLabel: 'until', closureReturn: 'We look forward to seeing you again afterwards.' };
        const weekday = new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { weekday: 'short' });
        const monthName = new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { month: 'long' });
        let view = 'week';
        let cursor = new Date();
        let events = [];

        function dateOnly(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
        function berlinToday() {
            const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
            return new Date(+values.year, +values.month - 1, +values.day);
        }
        function addDays(date, days) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
        function startOfWeek(date) { const mondayOffset = (date.getDay() + 6) % 7; return addDays(dateOnly(date), -mondayOffset); }
        function sameDay(first, second) { return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate(); }
        function parseIcsDate(value) {
            const digits = String(value || '').replace(/[^0-9]/g, '');
            return new Date(+digits.slice(0, 4), +digits.slice(4, 6) - 1, +digits.slice(6, 8), +digits.slice(8, 10) || 0, +digits.slice(10, 12) || 0);
        }
        function parseIcs(source) {
            return [...source.replace(/\r?\n[ \t]/g, '').matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].map((match) => {
                const item = {};
                match[1].split(/\r?\n/).forEach((line) => {
                    const separator = line.indexOf(':');
                    if (separator < 0) return;
                    item[line.slice(0, separator).split(';')[0]] = line.slice(separator + 1).replace(/\\,/g, ',').replace(/\\;/g, ';');
                });
                const closure = /^(true|yes|1)$/i.test(item['X-CONTRAST-CLOSURE'] || '');
                return { title: item.SUMMARY, date: parseIcsDate(item.DTSTART), end: item.DTEND, endDate: parseIcsDate(item.DTEND), slug: item['X-CONTRAST-SLUG'], series: item.CATEGORIES || item['X-CONTRAST-SERIES'] || '', price: item['X-CONTRAST-PRICE'] || '', closure, closureName: item['X-CONTRAST-CLOSURE-NAME'] || item.SUMMARY };
            }).filter((item) => item.title && !Number.isNaN(item.date.getTime()) && (item.slug || item.closure));
        }
        function timeFor(event) {
            const digits = String(event.end || '').replace(/[^0-9]/g, '');
            const start = `${String(event.date.getHours()).padStart(2, '0')}:${String(event.date.getMinutes()).padStart(2, '0')}`;
            return digits.length >= 12 ? `${start}–${digits.slice(8, 10)}:${digits.slice(10, 12)}` : start;
        }
        const recurringProgramme = {
            1: { title: de ? 'Queer-Kneipe' : 'Queer Night', route: 'Queer-Kneipe', time: '20:00–01:00', firstMondayOnly: true },
            2: { title: 'Das Labor', time: '21:00–01:00' },
            4: { title: de ? 'Punk-Kneipe' : 'Punk Night', route: 'Punk-Kneipe', time: '20:00–01:00' }
        };
        function isFirstMonday(day) { return day.getDay() === 1 && day.getDate() <= 7; }
        function regularFor(day) {
            if (day.getDay() === 1 && !isFirstMonday(day)) return { title: 'Kneipe', time: '20:00–01:00' };
            const regular = recurringProgramme[day.getDay()];
            return regular && (!regular.firstMondayOnly || isFirstMonday(day)) ? regular : null;
        }
        function closureFor(day) {
            return events.find((event) => event.closure && dateOnly(day) >= dateOnly(event.date) && dateOnly(day) < dateOnly(event.endDate));
        }
        function eventsFor(day) { return events.filter((event) => !event.closure && sameDay(event.date, day)); }
        function relativePosition(first, second, unit) {
            if (unit === 'week') return Math.round((startOfWeek(first) - startOfWeek(second)) / (7 * 24 * 60 * 60 * 1000));
            return (first.getFullYear() - second.getFullYear()) * 12 + first.getMonth() - second.getMonth();
        }
        function programmeTitle() {
            const position = relativePosition(cursor, new Date(), view);
            if (view === 'week') {
                if (de) {
                    if (position === -1) return 'Letzte Woche im Contrast.';
                    if (position === 0) return 'Diese Woche im Contrast.';
                    if (position === 1) return 'Nächste Woche im Contrast.';
                    return weekRangeLabel(startOfWeek(cursor));
                }
                if (position === -1) return 'Last week at Contrast.';
                if (position === 0) return 'This week at Contrast.';
                if (position === 1) return 'Next week at Contrast.';
                return weekRangeLabel(startOfWeek(cursor));
            }
            const month = monthName.format(cursor);
            return de ? `${month} im Contrast.` : `${month} at Contrast.`;
        }
        function weekRangeLabel(firstDay) {
            const lastDay = addDays(firstDay, 6);
            const locale = de ? 'de-DE' : 'en-GB';
            const day = new Intl.DateTimeFormat(locale, { day: 'numeric' });
            const month = new Intl.DateTimeFormat(locale, { month: 'short' });
            if (firstDay.getMonth() === lastDay.getMonth()) {
                return de
                    ? `${day.format(firstDay)}. - ${day.format(lastDay)}. ${month.format(firstDay)}`
                    : `${day.format(firstDay)} - ${day.format(lastDay)} ${month.format(firstDay)}`;
            }
            return de
                ? `${day.format(firstDay)}. ${month.format(firstDay)} - ${day.format(lastDay)}. ${month.format(lastDay)}`
                : `${day.format(firstDay)} ${month.format(firstDay)} - ${day.format(lastDay)} ${month.format(lastDay)}`;
        }
        function detailLink(event) {
            const link = document.createElement('a');
            const time = document.createElement('span');
            const meta = document.createElement('span');
            link.className = 'program-event';
            link.href = `./events/${encodeURIComponent(event.slug)}/`;
            link.append(document.createTextNode(event.title));
            time.textContent = timeFor(event);
            meta.className = 'program-event__meta';
            meta.append(time);
            if (event.price) {
                const price = document.createElement('span');
                price.textContent = `${copy.entry}: ${event.price}`;
                meta.append(price);
            }
            link.append(meta);
            return link;
        }
        function regularLink(regular) {
            const content = document.createDocumentFragment();
            content.append(document.createTextNode(regular.title));
            const time = document.createElement('span');
            time.textContent = regular.time;
            content.append(time);
            if (!regular.route) {
                const text = document.createElement('span');
                text.className = 'program-row__regular';
                text.append(content);
                return text;
            }
            const link = document.createElement('a');
            link.className = 'program-row__regular';
            link.href = `./${regular.route}/`;
            link.dataset.route = regular.route;
            link.append(content);
            return link;
        }
        function seriesLink(event) {
            const routes = { 'Queer-Kneipe': 'Queer-Kneipe', 'Punk-Kneipe': 'Punk-Kneipe', 'Info-Kneipe': 'Info-Kneipe', 'Kunst-Kneipe': 'Kunst-Kneipe', Spieleabend: 'Spieleabend' };
            const route = routes[event.series];
            if (!route) return null;
            const link = document.createElement('a');
            link.className = 'program-event__series';
            link.href = `./${route}/`;
            link.dataset.route = route;
            link.textContent = event.series;
            return link;
        }
        function closedMessage() {
            const closed = document.createElement('span');
            closed.className = 'program-row__regular program-row__regular--muted';
            closed.textContent = copy.closed;
            return closed;
        }
        function closureMessage(closure, showDetail) {
            const closed = document.createElement('span');
            closed.className = 'program-row__regular program-row__regular--muted program-row__closure';
            if (showDetail) {
                const lastDay = addDays(dateOnly(closure.endDate), -1);
                const shortDate = new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' }).format(lastDay);
                closed.textContent = `${closure.closureName} ${copy.closureUntilLabel} ${shortDate}`;
            } else {
                closed.classList.add('program-row__closure--continuation');
                closed.setAttribute('aria-label', `${copy.closure}: ${closure.closureName}`);
                closed.textContent = closure.closureName;
            }
            return closed;
        }
        function updateClosureSticker(firstDay, lastDay) {
            programme.querySelector('.program__closure-sticker')?.remove();
            const firstClosure = closureFor(firstDay);
            if (!firstClosure) return;
            for (let day = dateOnly(firstDay); day <= lastDay; day = addDays(day, 1)) {
                if (closureFor(day) !== firstClosure) return;
            }
            const sticker = document.createElement('p');
            sticker.className = 'program__closure-sticker';
            const lastClosureDay = addDays(dateOnly(firstClosure.endDate), -1);
            const shortDate = new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' }).format(lastClosureDay);
            sticker.textContent = `${firstClosure.closureName} ${copy.closureUntilLabel} ${shortDate}`;
            rows.append(sticker);
        }
        function closureDate(date) {
            return new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        }
        function showClosureNotice(closure) {
            const key = `contrast-closure-notice:${closure.closureName}:${closure.date.toISOString().slice(0, 10)}`;
            try { if (localStorage.getItem(key)) return; } catch { /* Storage may be unavailable. */ }
            const end = dateOnly(closure.endDate);
            const days = Math.max(1, Math.round((end - dateOnly(closure.date)) / 86400000));
            const modal = document.createElement('div');
            modal.className = 'closure-notice';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'closure-notice-title');
            modal.innerHTML = `<div class="closure-notice__panel"><p class="section-kicker">${copy.closure}</p><h2 id="closure-notice-title"></h2><p class="closure-notice__dates"></p><p class="closure-notice__return"></p><button type="button">${copy.closeNotice}</button></div>`;
            modal.querySelector('h2').textContent = closure.closureName;
            modal.querySelector('.closure-notice__dates').textContent = `${copy.closureFrom} ${closureDate(closure.date)} ${copy.closureUntil} ${closureDate(addDays(end, -1))} · ${days} ${days === 1 ? copy.closureDay : copy.closureDays}`;
            modal.querySelector('.closure-notice__return').textContent = copy.closureReturn;
            const close = () => {
                try { localStorage.setItem(key, 'true'); } catch { /* Storage may be unavailable. */ }
                modal.remove();
            };
            modal.querySelector('button').addEventListener('click', close);
            modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
            document.body.append(modal);
            modal.querySelector('button').focus();
        }
        const controls = document.createElement('div');
        controls.className = 'program__controls';
        controls.innerHTML = `<button type="button" data-step="-1" aria-label="${copy.previous}">←</button><button type="button" class="program__date-label" data-view-toggle aria-label="${copy.switchView}"></button><button type="button" data-step="1" aria-label="${copy.next}">→</button><p class="program__controls-kicker">${de ? 'Wann ist was los?' : 'What happens when?'}</p>`;
        programme.querySelector('.program__heading').append(controls);
        const dateLabel = controls.querySelector('.program__date-label');

        function renderWeek() {
            const first = startOfWeek(cursor);
            const today = berlinToday();
            const shownClosures = new Set();
            heading.textContent = programmeTitle();
            dateLabel.textContent = copy.week;
            rows.className = 'program__rows';
            rows.replaceChildren();
            for (let index = 0; index < 7; index += 1) {
                const day = addDays(first, index);
                const row = document.createElement('article');
                const dayLabel = document.createElement('p');
                const items = document.createElement('div');
                row.className = 'program-row';
                if (sameDay(day, today)) row.classList.add('is-today');
                dayLabel.className = 'program-row__day';
                dayLabel.textContent = weekday.format(day).replace('.', '').toUpperCase();
                items.className = 'program-row__calendar-events';
                const closure = closureFor(day);
                const dayEvents = eventsFor(day);
                const regular = dayEvents.some((event) => event.series) ? null : regularFor(day);
                if (closure) {
                    const showDetail = !shownClosures.has(closure);
                    shownClosures.add(closure);
                    row.classList.add('program-row--closure');
                    items.append(closureMessage(closure, showDetail));
                }
                else if (regular) items.append(regularLink(regular));
                if (!closure && dayEvents.length) {
                    const specials = document.createElement('div');
                    specials.className = 'program-row__calendar-events';
                    dayEvents.forEach((item) => {
                        const event = document.createElement('div');
                        event.className = 'program-event-wrap';
                        event.append(detailLink(item));
                        const series = seriesLink(item);
                        if (series) event.append(series);
                        specials.append(event);
                    });
                    items.append(specials);
                }
                if (!closure && !regular && !dayEvents.length) items.append(closedMessage());
                row.append(dayLabel, items);
                rows.append(row);
            }
            updateClosureSticker(first, addDays(first, 6));
        }
        function renderMonth() {
            const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
            const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
            const today = berlinToday();
            const shownClosures = new Set();
            heading.textContent = programmeTitle();
            dateLabel.textContent = copy.month;
            rows.className = 'program__month';
            rows.replaceChildren();
            // The calendar always runs Monday–Sunday, matching the week view.
            for (let index = 0; index < 7; index += 1) {
                const header = document.createElement('p');
                const day = addDays(startOfWeek(first), index);
                header.className = 'program__month-weekday';
                header.textContent = weekday.format(day).replace('.', '').toUpperCase();
                rows.append(header);
            }
            const leadingEmptyCells = (first.getDay() + 6) % 7;
            for (let index = 0; index < leadingEmptyCells; index += 1) {
                const empty = document.createElement('div');
                empty.className = 'program__month-day program__month-day--empty';
                empty.setAttribute('aria-hidden', 'true');
                rows.append(empty);
            }
            for (let number = 1; number <= lastDay; number += 1) {
                const day = new Date(first.getFullYear(), first.getMonth(), number);
                const cell = document.createElement('div');
                const label = document.createElement('strong');
                const closure = closureFor(day);
                const dayEvents = eventsFor(day);
                const regular = dayEvents.some((event) => event.series) ? null : regularFor(day);
                cell.className = 'program__month-day';
                if (sameDay(day, today)) cell.classList.add('is-today');
                label.textContent = number;
                cell.append(label);
                if (closure) {
                    const showDetail = !shownClosures.has(closure);
                    shownClosures.add(closure);
                    cell.classList.add('program__month-day--closure');
                    cell.append(closureMessage(closure, showDetail));
                }
                else if (regular) cell.append(regularLink(regular));
                if (!closure) dayEvents.forEach((item) => {
                    cell.append(detailLink(item));
                    const series = seriesLink(item);
                    if (series) cell.append(series);
                });
                if (!closure && !regular && !dayEvents.length) cell.append(closedMessage());
                rows.append(cell);
            }
            updateClosureSticker(first, new Date(first.getFullYear(), first.getMonth(), lastDay));
        }
        function renderProgramme() { if (view === 'month') renderMonth(); else renderWeek(); }

        controls.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;
            if (button.dataset.viewToggle !== undefined) view = view === 'week' ? 'month' : 'week';
            if (button.dataset.step) cursor = view === 'week' ? addDays(cursor, Number(button.dataset.step) * 7) : new Date(cursor.getFullYear(), cursor.getMonth() + Number(button.dataset.step), 1);
            renderProgramme();
        });

        try {
            const response = await fetch(new URL('assets/data/events.ics', document.baseURI));
            if (!response.ok) throw new Error('Calendar unavailable');
            events = parseIcs(await response.text());
        } catch (error) {
            console.warn('Contrast calendar could not be loaded:', error);
        }
        renderProgramme();
        const activeClosure = closureFor(new Date());
        if (activeClosure) showClosureNotice(activeClosure);
    }

    // Handle both persistent navigation and links inside dynamically loaded content.
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-route]');
        if (!link || !validRoutes.has(link.dataset.route)) return;
        // The events overview is a generated, fully static page. Let the
        // browser load it instead of asking the legacy fragment loader for a
        // non-existent pages/events.html file.
        if (link.dataset.route === 'events') return;
        if (staticLocale) return;

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
            if (staticLocale) {
                // Keep the GitHub Pages project directory (for example
                // /Contrast/) in front of the locale segment.
                const currentPath = window.location.pathname.slice(siteRoot.pathname.length).replace(/^\/+/, '');
                const routePath = currentPath.replace(/^en\/?/, '');
                const target = new URL(language === 'en' ? `en/${routePath}` : routePath || './', siteRoot);
                target.search = window.location.search;
                target.hash = window.location.hash;
                window.location.assign(target.href);
                return;
            }
            currentLanguage = language;
            applyChromeLanguage();
            loadContent(`${main.dataset.route || routeFromLocation()}.html`, true);
        });
    });

    // Initial content load
    applyChromeLanguage();
    const initialRoute = routeFromLocation();
    const initialFile = `${initialRoute}.html`;
    const isStandaloneEventPage = main.dataset.route === 'event';
    const oldQueryRoute = new URLSearchParams(window.location.search).get('page');
    const oldHashRoute = window.location.hash.substring(1);
    if (validRoutes.has(oldQueryRoute) || validRoutes.has(oldHashRoute)) {
        history.replaceState({ file: initialFile }, '', routeUrl(initialRoute));
    }
    if (isStandaloneEventPage) {
        // Generated event pages are standalone documents so their canonical URL,
        // schema and rich event content stay intact for visitors and crawlers.
        enhanceZoomableImages();
    } else if (staticLocale || (currentLanguage === 'en' && main.dataset.route === initialRoute)) {
        protectInstagramEmbeds(document);
        protectFacebookEmbeds(document);
        enhanceZoomableImages();
        enableInstagramEmbeds();
        enableFacebookEmbeds();
        initializeVenueCarousel();
        initializeBandArchive();
        initializeEventsArchive();
        initializeCalendarDownload();
        positionHomeProgramme();
        initializeProgrammeControls();
        updateActiveLink(initialFile);
        updatePageMetadata(initialRoute);
        if (initialRoute === 'Queer-Kneipe') initializeRainbowCursor();
    } else {
        loadContent(initialFile);
    }
});

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { locales, routes } from '../content/routes.mjs';
import { generateAssetManifest } from './generate-asset-manifest.mjs';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectDir, 'dist');
const siteUrl = 'https://contrast-kn.de';
const cspPlaceholder = '<!-- CSP_PLACEHOLDER -->';
const historyBands = JSON.parse(fs.readFileSync(path.join(projectDir, 'content/history-bands.json'), 'utf8'));
// VS Code Live Server injects this exact reload helper in local previews.
// A hash permits only this byte-for-byte script; arbitrary inline JS remains blocked.
const liveServerReloadHash = "'sha256-vvt4KWwuNr51XfE5m+hzeNEGhiOfZzG97ccfqGsPwvE='";

function applyContentSecurityPolicy(html) {
  const hashes = [liveServerReloadHash, ...[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes]) => !/\bsrc\s*=/.test(attributes))
    .map(([, , content]) => `'sha256-${crypto.createHash('sha256').update(content).digest('base64')}'`)];
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `script-src 'self'${hashes.length ? ` ${hashes.join(' ')}` : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    'frame-src https://www.instagram.com https://instagram.com https://www.facebook.com',
    "form-action 'self'"
  ].join('; ');
  if (!html.includes(cspPlaceholder)) throw new Error('Missing CSP placeholder in page template.');
  return html.replace(cspPlaceholder, `<meta http-equiv="Content-Security-Policy" content="${policy}">`);
}

// `routes.mjs` is the source of truth for locale coverage. During migration,
// existing translated fragments remain the copy source; the layout is shared.
function localizedContent(route, locale, indexSource) {
  const file = route.files[locale];
  if (file === '__index__') return indexSource.match(/<main(?:\s[^>]*)?>([\s\S]*?)<\/main>/i)[1];
  const location = path.join(projectDir, locales[locale].contentDirectory, file);
  const source = fs.readFileSync(location, 'utf8');
  const match = source.match(/<main(?:\s[^>]*)?>([\s\S]*?)<\/main>/i);
  if (!match) throw new Error(`No <main> found in ${location}`);
  return match[1];
}

function localizedUrl(route, locale) {
  const prefix = locales[locale].prefix;
  return `${siteUrl}/${[prefix, route.path].filter(Boolean).join('/')}${route.path || prefix ? '/' : ''}`;
}

const pages = {
  home: {
    path: '',
    title: 'Contrast Konstanz | Alternative Music, Art & Culture',
    description: 'Contrast is a self-managed youth club in Konstanz for alternative music, art, culture and an open community.',
    image: 'assets/images/venue/contrast-venue-01.jpg'
  },
  'Queer-Kneipe': {
    path: 'Queer-Kneipe',
    content: 'Queer-Kneipe.html',
    title: 'Queer Night in Konstanz | Contrast',
    description: 'Queer Night at Contrast Konstanz is an open, safer meeting place with music, conversation and community every Monday.',
    image: 'assets/icons/events/queer-kneipe.webp'
  },
  'Das-Labor': {
    path: 'Das-Labor',
    content: 'Das-Labor.html',
    title: 'The Lab – experimental music in Konstanz | Contrast',
    description: 'Electronic sounds, experimental music and creative performances every Tuesday at Contrast Konstanz.',
    image: 'assets/icons/events/das-labor.webp'
  },
  'Punk-Kneipe': {
    path: 'Punk-Kneipe',
    content: 'Punk-Kneipe.html',
    title: 'Punk Night in Konstanz | Contrast',
    description: 'Punk, community and affordable drinks every Thursday at Punk Night in Contrast Konstanz.',
    image: 'assets/icons/events/punk-kneipe.webp'
  },
  'Info-Kneipe': {
    path: 'Info-Kneipe',
    content: 'Info-Kneipe.html',
    title: 'Info Night – Talks & Discussion | Contrast Konstanz',
    description: 'Talks and discussions about politics, society, the environment and culture at Info Night in Contrast Konstanz.',
    image: 'assets/icons/events/info-kneipe.webp'
  },
  'Kunst-Kneipe': {
    path: 'Kunst-Kneipe',
    content: 'Kunst-Kneipe.html',
    title: 'Art Night in Konstanz | Contrast',
    description: 'Experience art, get creative together and meet local artists at Art Night in Contrast Konstanz.',
    image: 'assets/icons/events/kunstkneipe.png'
  },
  Spieleabend: {
    path: 'Spieleabend',
    content: 'Spieleabend.html',
    title: 'Games Night in Konstanz | Contrast',
    description: 'Board games, card games and an open community at Games Night in Contrast Konstanz.',
    image: 'assets/icons/events/spieleabend.webp'
  },
  mitglied: {
    path: 'mitglied',
    content: 'mitglied.html',
    title: 'Become a Member | Contrast Konstanz',
    description: 'Become a Contrast member and help shape alternative music, art, culture and community events in Konstanz.',
    image: 'assets/images/membership-poster.webp'
  },
  Kontakt: {
    path: 'Kontakt',
    content: 'Kontakt.html',
    title: 'Contact, Directions & Opening Hours | Contrast Konstanz',
    description: 'Address, directions, opening hours and booking contact for Contrast at Joseph-Belli-Weg 11 in Konstanz.',
    image: 'assets/images/map.webp'
  },
  About: {
    path: 'About',
    content: 'About.html',
    title: 'About Contrast Konstanz | Community, Culture & Club',
    description: 'Learn about Contrast, the self-managed youth club in Konstanz for alternative culture, music and community.',
    image: 'assets/images/venue/contrast-venue-06.jpg'
  },
  Archiv: {
    path: 'Archiv',
    content: 'Archiv.html',
    title: 'Archiv: Bands at Contrast | Konstanz',
    description: 'A researched archive of bands documented at Mauerblümchen, Outback and Contrast in Konstanz.',
    image: 'assets/images/venue/contrast-venue-06.jpg'
  }
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': ['MusicVenue', 'LocalBusiness'],
  '@id': `${siteUrl}/#venue`,
  name: 'Contrast',
  url: `${siteUrl}/`,
  logo: `${siteUrl}/assets/images/logo-original.webp`,
  image: [
    `${siteUrl}/assets/images/venue/contrast-venue-01.jpg`,
    `${siteUrl}/assets/images/venue/contrast-venue-06.jpg`
  ],
  description: 'Self-managed youth club for alternative music, art and culture in Konstanz.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Joseph-Belli-Weg 11',
    addressLocality: 'Konstanz',
    postalCode: '78467',
    addressCountry: 'DE'
  },
  email: 'info@contrast-kn.de',
  publicAccess: true,
  priceRange: '€',
  hasMap: 'https://www.google.com/maps/search/?api=1&query=Joseph-Belli-Weg+11,+Konstanz+78467,+Germany',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'https://schema.org/Monday',
      opens: '20:00',
      closes: '01:00'
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'https://schema.org/Tuesday',
      opens: '21:00',
      closes: '01:00'
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'https://schema.org/Thursday',
      opens: '20:00',
      closes: '01:00'
    }
  ],
  sameAs: [
    'https://www.instagram.com/contrast_kn/',
    'https://www.facebook.com/Contrastkn/'
  ]
};

const escapeHtml = (value = '') => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));

function safeExternalUrl(value = '') {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function parseIcsEvents() {
  const icsPath = path.join(projectDir, 'assets', 'data', 'events.ics');
  if (!fs.existsSync(icsPath)) return [];
  const source = fs.readFileSync(icsPath, 'utf8').replace(/\r?\n[ \t]/g, '');
  return [...source.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].map((match) => {
    const event = { artists: [] };
    for (const line of match[1].split(/\r?\n/)) {
      const separator = line.indexOf(':');
      if (separator < 0) continue;
      const key = line.slice(0, separator).split(';')[0];
      const value = line.slice(separator + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
      if (key === 'X-CONTRAST-ARTISTS') event.artists.push(value.split('|'));
      else event[key] = value;
    }
    return event;
  }).filter((event) => event.SUMMARY && event.DTSTART && event['X-CONTRAST-SLUG']);
}

function eventDate(value) {
  const compact = value.replace(/[^0-9]/g, '').slice(0, 14);
  return new Date(Date.UTC(+compact.slice(0, 4), +compact.slice(4, 6) - 1, +compact.slice(6, 8), 12));
}

function eventTime(value) {
  const compact = value.replace(/[^0-9]/g, '').slice(0, 14);
  return `${compact.slice(8, 10)}:${compact.slice(10, 12)}`;
}

function eventIso(value) {
  const compact = value.replace(/[^0-9]/g, '').slice(0, 14);
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(8, 10)}:${compact.slice(10, 12)}:00+01:00`;
}

function eventSeries(event) {
  return event.CATEGORIES || event['X-CONTRAST-SERIES'] || '';
}

function eventOffer(event) {
  const label = event['X-CONTRAST-PRICE'] || '';
  const values = [...label.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => Number(match[0].replace(',', '.')));
  if (/free entry/i.test(label)) {
    return { '@type': 'Offer', price: 0, priceCurrency: 'EUR', availability: 'https://schema.org/InStock' };
  }
  if (!values.length) return undefined;
  const priceSpecification = values.length > 1
    ? { '@type': 'PriceSpecification', minPrice: Math.min(...values), maxPrice: Math.max(...values), priceCurrency: 'EUR' }
    : { '@type': 'PriceSpecification', price: values[0], priceCurrency: 'EUR' };
  return { '@type': 'Offer', priceSpecification, availability: 'https://schema.org/InStock' };
}

function eventStructuredData(event, locale = 'de') {
  const image = safeExternalUrl(event['X-CONTRAST-IMAGE']) || `${siteUrl}/assets/images/venue/contrast-venue-04.jpg`;
  const offer = eventOffer(event);
  const musicEvent = /concert|dj|live music/i.test(event['X-CONTRAST-TYPE'] || '');
  const localePrefix = locale === 'en' ? 'en/' : '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': musicEvent ? 'MusicEvent' : 'Event',
    '@id': `${siteUrl}/${localePrefix}events/${event['X-CONTRAST-SLUG']}/#event`,
    name: event.SUMMARY,
    url: `${siteUrl}/${localePrefix}events/${event['X-CONTRAST-SLUG']}/`,
    mainEntityOfPage: `${siteUrl}/${localePrefix}events/${event['X-CONTRAST-SLUG']}/`,
    description: (event.DESCRIPTION || event.SUMMARY).replace(/\n/g, ' '),
    image: [image],
    startDate: eventIso(event.DTSTART),
    endDate: eventIso(event.DTEND || event.DTSTART),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: locale,
    keywords: event['X-CONTRAST-TAGS'] || undefined,
    location: { '@id': structuredData['@id'], '@type': 'MusicVenue', name: 'Contrast', address: structuredData.address },
    organizer: { '@type': 'Organization', name: 'Contrast e.V.', url: siteUrl },
    performer: event.artists.length ? event.artists.map(([name, bio, url]) => ({ '@type': 'PerformingGroup', name, description: bio || undefined, url: safeExternalUrl(url) || undefined })) : undefined,
    offers: offer
  };
  return Object.fromEntries(Object.entries(schema).filter(([, value]) => value !== undefined));
}

function eventPage(event, locale = 'de') {
  const de = locale === 'de';
  const copy = de
    ? { back: '← Zurück zum Programm', when: 'Wann', where: 'Wo', entry: 'Eintritt', details: 'Details folgen', lineup: 'Line-up', lineupHeading: 'Die Menschen, die den Lärm machen.', atmosphere: 'Eindruck von' }
    : { back: '← Back to programme', when: 'When', where: 'Where', entry: 'Entry', details: 'Details soon', lineup: 'Line-up', lineupHeading: 'The people making the noise.', atmosphere: 'Atmosphere at' };
  const start = eventDate(event.DTSTART);
  const end = eventDate(event.DTEND || event.DTSTART);
  const date = new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { dateStyle: 'full', timeZone: 'Europe/Berlin' }).format(start);
  const artists = event.artists.map(([name, bio = '', url = '']) => {
    const artistUrl = safeExternalUrl(url);
    return `<li><strong>${escapeHtml(name)}</strong><span>${escapeHtml(bio)}</span>${artistUrl ? `<a href="${escapeHtml(artistUrl)}" target="_blank" rel="noopener noreferrer">Artist site ↗</a>` : ''}</li>`;
  }).join('');
  const image = safeExternalUrl(event['X-CONTRAST-IMAGE']) || `${siteUrl}/assets/images/venue/contrast-venue-04.jpg`;
  const description = event.DESCRIPTION || event.SUMMARY;
  return `<main id="main-content" tabindex="-1" data-route="event"><article class="event-page"><a class="event-page__back" href="./${de ? '' : 'en/'}">${copy.back}</a><p class="section-kicker">${escapeHtml(event['X-CONTRAST-TYPE'] || 'Event')} · Contrast Konstanz</p><h1>${escapeHtml(event.SUMMARY)}</h1><p class="event-page__lead">${escapeHtml(description).replace(/\n/g, '<br>')}</p><div class="event-page__meta"><p><strong>${copy.when}</strong><span>${date}<br>${eventTime(event.DTSTART)}–${eventTime(event.DTEND || event.DTSTART)}</span></p><p><strong>${copy.where}</strong><span>Contrast<br>Joseph-Belli-Weg 11, Konstanz</span></p><p><strong>${copy.entry}</strong><span>${escapeHtml(event['X-CONTRAST-PRICE'] || copy.details)}</span></p></div><img class="event-page__image" src="${escapeHtml(image)}" alt="${copy.atmosphere} ${escapeHtml(event.SUMMARY)}"><section class="event-page__lineup"><p class="section-kicker">${copy.lineup}</p><h2>${copy.lineupHeading}</h2><ul>${artists}</ul></section><p class="event-page__tags">${escapeHtml(event['X-CONTRAST-TAGS'] || '')}</p></article></main>`;
}

function mainMarkup(contentFile) {
  const content = fs.readFileSync(path.join(projectDir, 'pages', contentFile), 'utf8');
  const match = content.match(/<main(?:\s[^>]*)?>([\s\S]*?)<\/main>/i);
  if (!match) throw new Error(`No <main> found in pages/${contentFile}`);
  const route = contentFile.replace(/\.html$/, '');
  return `<main id="main-content" tabindex="-1" data-route="${route}">${match[1]}</main>`;
}

function historyArchiveMarkup(locale) {
  const de = locale === 'de';
  const grouped = new Map();
  historyBands.forEach((band) => {
    const era = band.era || (de ? 'Ohne Zuordnung' : 'Unassigned');
    if (!grouped.has(era)) grouped.set(era, []);
    grouped.get(era).push(band);
  });
  const copy = de
    ? { search: 'Bands suchen', searchHint: 'Name eingeben', sort: 'Sortieren', name: 'Name A–Z', newest: 'Datum: neu zuerst', oldest: 'Datum: alt zuerst', noResults: 'Keine passende Band gefunden.' }
    : { search: 'Search bands', searchHint: 'Enter a name', sort: 'Sort', name: 'Name A–Z', newest: 'Date: newest first', oldest: 'Date: oldest first', noResults: 'No matching band found.' };
  return `<div class="history-archive__controls"><label><span>${copy.search}</span><input type="search" data-history-search placeholder="${copy.searchHint}" autocomplete="off"></label><label><span>${copy.sort}</span><select data-history-sort><option value="name">${copy.name}</option><option value="date-desc">${copy.newest}</option><option value="date-asc">${copy.oldest}</option></select></label></div><p class="history-archive__empty" data-history-empty hidden>${copy.noResults}</p><div class="history-archive__groups">${[...grouped.entries()].map(([era, bands]) => `<details class="history-archive__era"><summary>${escapeHtml(era)} <span data-history-count>${bands.length}</span></summary><ul>${bands.map((band) => `<li data-history-band data-name="${escapeHtml(band.artist.toLocaleLowerCase())}" data-date="${escapeHtml(band.dates || '')}"><strong>${escapeHtml(band.artist)}</strong>${band.dates ? `<time>${escapeHtml(band.dates)}</time>` : ''}${band.sourceUrl ? `<a href="${escapeHtml(band.sourceUrl)}" target="_blank" rel="noopener noreferrer">${de ? 'Quelle' : 'Source'} ↗</a>` : ''}</li>`).join('')}</ul></details>`).join('')}</div>`;
}

function setMeta(html, page, isRoot) {
  const canonical = `${siteUrl}/${page.path ? `${page.path}/` : ''}`;
  const image = `${siteUrl}/${page.image}`;
  // Each generated route can be nested (for example /events/<slug>/), so
  // asset resolution must climb exactly back to the site root.
  const depth = page.path ? page.path.split('/').filter(Boolean).length : 0;
  const base = isRoot ? '' : `  <base href="${'../'.repeat(depth)}">\n`;
  html = html.replace(/\s*<base href="[^"]*">\s*/i, '\n');
  html = html.replace(/<head>\s*/i, `<head>\n${base}`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${page.title}</title>`);
  html = html.replace(
    /<meta name="description"\s+content="[^"]*">/i,
    `<meta name="description" content="${page.description}">`
  );
  html = html.replace(/\s*<meta name="keywords"[^>]*>/i, '');
  html = html.replace(/\s*<link rel="canonical"[^>]*>/i, '');
  html = html.replace(/\s*<meta property="og:[^>]*>/gi, '');
  html = html.replace(/\s*<meta name="twitter:card"[^>]*>/gi, '');
  const socialMeta = `
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_GB">
  <meta property="og:site_name" content="Contrast">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">`;
  html = html.replace('</title>', `</title>${socialMeta}`);
  html = html.replace(
    /<a class="skip-link" href="[^"]*">/,
    `<a class="skip-link" href="${isRoot ? '#main-content' : `./${page.path}/#main-content`}">`
  );
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>`
  );
  return html;
}

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function removeDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) removeDirectory(target);
    else fs.unlinkSync(target);
  }
  fs.rmdirSync(directory);
}

if (fs.existsSync(outputDir)) {
  removeDirectory(outputDir);
}
fs.mkdirSync(outputDir, { recursive: true });
generateAssetManifest();
copyDirectory(path.join(projectDir, 'assets'), path.join(outputDir, 'assets'));
copyDirectory(path.join(projectDir, 'pages'), path.join(outputDir, 'pages'));
fs.copyFileSync(path.join(projectDir, 'robots.txt'), path.join(outputDir, 'robots.txt'));
const assetBrowser = fs.readFileSync(path.join(projectDir, 'asset-browser.html'), 'utf8');
fs.writeFileSync(path.join(outputDir, 'asset-browser.html'), applyContentSecurityPolicy(assetBrowser));

let template = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
template = setMeta(template, pages.home, true);
fs.writeFileSync(path.join(outputDir, 'index.html'), applyContentSecurityPolicy(template));

for (const [route, page] of Object.entries(pages)) {
  if (route === 'home') continue;
  let html = template.replace(/<main id="main-content"[\s\S]*?<\/main>/i, mainMarkup(page.content));
  html = setMeta(html, page, false);
  const routeDir = path.join(outputDir, page.path);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), applyContentSecurityPolicy(html));
}

// Locale output is generated from the registry above. German is the canonical
// root language; English lives under /en/. These are static documents, so a
// crawler never depends on JavaScript or browser-language detection.
for (const [locale, localeInfo] of Object.entries(locales)) {
  for (const [routeName, route] of Object.entries(routes)) {
    const content = localizedContent(route, locale, template).replace('<!-- HISTORY_ARCHIVE -->', historyArchiveMarkup(locale));
    const publicPath = [localeInfo.prefix, route.path].filter(Boolean).join('/');
    const fallback = pages[routeName] || pages.home;
    const page = { ...fallback, path: publicPath };
    let html = template.replace(/<main id="main-content"[\s\S]*?<\/main>/i, `<main id="main-content" tabindex="-1" data-route="${routeName}">${content}</main>`);
    html = setMeta(html, page, !publicPath);
    html = html.replace('<html lang="en">', `<html lang="${locale}" data-static-locale="${locale}">`);
    const alternates = Object.entries(locales).map(([alternateLocale]) => `  <link rel="alternate" hreflang="${alternateLocale}" href="${localizedUrl(route, alternateLocale)}">`).join('\n');
    html = html.replace('</head>', `${alternates}\n  <link rel="alternate" hreflang="x-default" href="${localizedUrl(route, 'de')}">\n</head>`);
    const destination = path.join(outputDir, publicPath);
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(path.join(destination, 'index.html'), applyContentSecurityPolicy(html));
  }
}

const calendarEvents = parseIcsEvents().filter((event) => !/^(true|yes|1)$/i.test(event['X-CONTRAST-CLOSURE'] || ''));

function seriesListings(series, locale = 'en') {
  const now = new Date('2026-10-21T12:00:00+02:00'); // sample programme week; replace with live build date on calendar sync
  const entries = calendarEvents.filter((event) => eventSeries(event) === series);
  const format = new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Berlin' });
  const item = (event) => `<li><time datetime="${eventIso(event.DTSTART)}">${format.format(eventDate(event.DTSTART))}</time><a href="./${locale === 'en' ? 'en/' : ''}events/${event['X-CONTRAST-SLUG']}/">${escapeHtml(event.SUMMARY)}</a></li>`;
  const upcoming = entries.filter((event) => eventDate(event.DTSTART) >= now).sort((a, b) => a.DTSTART.localeCompare(b.DTSTART)).slice(0, 3);
  const past = entries.filter((event) => eventDate(event.DTSTART) < now).sort((a, b) => b.DTSTART.localeCompare(a.DTSTART)).slice(0, 4);
  const labels = locale === 'de' ? { upcoming: 'Als Nächstes', past: 'Vergangene Abende', empty: 'Gerade keine Specials angekündigt.' } : { upcoming: 'Coming up', past: 'Previous nights', empty: 'No special dates announced yet.' };
  return `<section class="series-events" aria-label="${escapeHtml(series)} events"><div><p class="section-kicker">${labels.upcoming}</p>${upcoming.length ? `<ul>${upcoming.map(item).join('')}</ul>` : `<p>${labels.empty}</p>`}</div>${past.length ? `<div><p class="section-kicker">${labels.past}</p><ul>${past.map(item).join('')}</ul></div>` : ''}</section>`;
}

function nextOccurrence(series, locale = 'en') {
  const now = new Date('2026-10-21T12:00:00+02:00');
  const next = calendarEvents.filter((event) => eventSeries(event) === series && eventDate(event.DTSTART) >= now).sort((a, b) => a.DTSTART.localeCompare(b.DTSTART))[0];
  const copy = locale === 'de' ? { label: 'Nächster Termin', empty: 'Der nächste Termin wird bald angekündigt.' } : { label: 'Next occurrence', empty: 'The next date will be announced soon.' };
  if (!next) return `<section class="next-occurrence"><p class="section-kicker">${copy.label}</p><p>${copy.empty}</p></section>`;
  const date = new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }).format(eventDate(next.DTSTART));
  return `<section class="next-occurrence"><p class="section-kicker">${copy.label}</p><p><time datetime="${eventIso(next.DTSTART)}">${date} · ${eventTime(next.DTSTART)}</time></p><a href="./${locale === 'en' ? 'en/' : ''}events/${next['X-CONTRAST-SLUG']}/">${escapeHtml(next.SUMMARY)} <span aria-hidden="true">→</span></a></section>`;
}
for (const event of calendarEvents) {
  const slug = event['X-CONTRAST-SLUG'];
  for (const locale of ['de', 'en']) {
    const localePrefix = locale === 'en' ? 'en/' : '';
    const page = {
      path: `${localePrefix}events/${slug}`,
      title: `${event.SUMMARY} | Contrast Konstanz`,
      description: (event.DESCRIPTION || event.SUMMARY).replace(/\n/g, ' ').slice(0, 155),
      image: (safeExternalUrl(event['X-CONTRAST-IMAGE']) || '').replace(`${siteUrl}/`, '') || 'assets/images/venue/contrast-venue-04.jpg'
    };
    let html = template.replace(/<main id="main-content"[\s\S]*?<\/main>/i, eventPage(event, locale));
    html = setMeta(html, page, false);
    html = html.replace('<html lang="en">', `<html lang="${locale}" data-static-locale="${locale}">`);
    html = html.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(eventStructuredData(event, locale))}</script>\n</head>`);
    const routeDir = path.join(outputDir, page.path);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), applyContentSecurityPolicy(html));
  }
}

const sitemapUrls = [
  ...Object.values(pages).map((page) => `${siteUrl}/${page.path ? `${page.path}/` : ''}`),
  ...calendarEvents.flatMap((event) => [`${siteUrl}/events/${event['X-CONTRAST-SLUG']}/`, `${siteUrl}/en/events/${event['X-CONTRAST-SLUG']}/`])
];
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`);

for (const series of ['Queer-Kneipe', 'Punk-Kneipe']) {
  for (const locale of ['de', 'en']) {
    const publicPath = [locales[locale].prefix, series].filter(Boolean).join('/');
    const file = path.join(outputDir, publicPath, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace('</main>', `${seriesListings(series, locale)}</main>`);
    fs.writeFileSync(file, html);
  }
}
for (const series of ['Info-Kneipe', 'Kunst-Kneipe']) {
  for (const locale of ['de', 'en']) {
    const publicPath = [locales[locale].prefix, series].filter(Boolean).join('/');
    const file = path.join(outputDir, publicPath, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('class="next-occurrence"')) {
      html = html.replace('</main>', `${nextOccurrence(series, locale)}</main>`);
    }
    fs.writeFileSync(file, html);
  }
}

console.log(`Generated ${Object.keys(pages).length + calendarEvents.length} indexable routes in dist/.`);

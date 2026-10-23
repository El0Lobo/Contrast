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
const artistProfilesPath = path.join(projectDir, 'content', 'artists.json');
const artistProfiles = fs.existsSync(artistProfilesPath)
  ? JSON.parse(fs.readFileSync(artistProfilesPath, 'utf8')).artists || {}
  : {};
// VS Code Live Server injects this exact reload helper in local previews.
// A hash permits only this byte-for-byte script; arbitrary inline JS remains blocked.
const liveServerReloadHash = "'sha256-vvt4KWwuNr51XfE5m+hzeNEGhiOfZzG97ccfqGsPwvE='";

function decorateStaticNavigation(html) {
  const locale = html.match(/<html\b[^>]*\bdata-static-locale="(de|en)"/i)?.[1];
  const route = html.match(/<main\b[^>]*\bdata-route="([^"]+)"/i)?.[1];
  if (!locale) return html;

  // These states are in the document itself, rather than relying only on
  // JavaScript. Visitors can therefore identify their selected language and
  // page even if a script is delayed, blocked, or fails to load.
  html = html.replace(
    /(<button\b[^>]*\bdata-language="de"[^>]*)(>)/i,
    `$1 aria-pressed="${locale === 'de'}"$2`
  );
  html = html.replace(
    /(<button\b[^>]*\bdata-language="en"[^>]*)(>)/i,
    `$1 aria-pressed="${locale === 'en'}"$2`
  );
  const navigationRoute = ['event', 'artist'].includes(route) ? 'events' : route;
  if (navigationRoute) {
    const escapedRoute = navigationRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(
      new RegExp(`(<a\\b[^>]*\\bdata-route="${escapedRoute}"[^>]*)>`, 'i'),
      '$1 class="is-active" aria-current="page">'
    );
  }
  return html;
}

function applyContentSecurityPolicy(html) {
  html = decorateStaticNavigation(html);
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
    performer: event.artists.length ? event.artists.map(([name, bio, url]) => {
      const artist = artistDirectory.get(artistKey(name));
      const profileUrl = artist ? `${siteUrl}/${localePrefix}artists/${artist.slug}/` : undefined;
      return {
        '@type': /^dj\b/i.test(name) ? 'Person' : 'MusicGroup',
        name,
        description: bio || undefined,
        url: profileUrl || safeExternalUrl(url) || undefined,
        sameAs: safeExternalUrl(url) || undefined
      };
    }) : undefined,
    offers: offer
  };
  return Object.fromEntries(Object.entries(schema).filter(([, value]) => value !== undefined));
}

function publicEvent(event) {
  const slug = event['X-CONTRAST-SLUG'];
  const url = `${siteUrl}/events/${slug}/`;
  const image = safeExternalUrl(event['X-CONTRAST-IMAGE']) || `${siteUrl}/assets/images/venue/contrast-venue-04.jpg`;
  return {
    id: event.UID || `${slug}@contrast-kn.de`, url, title: event.SUMMARY,
    description: event.DESCRIPTION || '', startDate: eventIso(event.DTSTART), endDate: eventIso(event.DTEND || event.DTSTART),
    timezone: 'Europe/Berlin', status: 'scheduled', eventType: event['X-CONTRAST-TYPE'] || 'Event',
    categories: (event.CATEGORIES || event['X-CONTRAST-SERIES'] || '').split(',').map((value) => value.trim()).filter(Boolean),
    tags: (event['X-CONTRAST-TAGS'] || '').split(',').map((value) => value.trim()).filter(Boolean),
    price: event['X-CONTRAST-PRICE'] || null, image,
    location: { name: 'Contrast', address: 'Joseph-Belli-Weg 11, 78467 Konstanz, Germany', url: siteUrl },
    artists: event.artists.map(([name, description = '', artistUrl = '']) => ({ name, description: description || null, url: safeExternalUrl(artistUrl) || null }))
  };
}

const escapeXml = (value = '') => String(value).replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]));
const escapeIcs = (value = '') => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

function publicIcs(events) {
  const eventLines = events.map((event) => {
    const categories = (event.CATEGORIES || event['X-CONTRAST-SERIES'] || '').split(',').map((value) => value.trim()).filter(Boolean);
    const dated = /^\d{8}$/.test(event.DTSTART);
    const start = dated ? `DTSTART;VALUE=DATE:${event.DTSTART}` : `DTSTART;TZID=Europe/Berlin:${event.DTSTART}`;
    const end = dated ? `DTEND;VALUE=DATE:${event.DTEND || event.DTSTART}` : `DTEND;TZID=Europe/Berlin:${event.DTEND || event.DTSTART}`;
    return ['BEGIN:VEVENT', `UID:${escapeIcs(event.UID || `${event['X-CONTRAST-SLUG']}@contrast-kn.de`)}`, start, end,
      `SUMMARY:${escapeIcs(event.SUMMARY)}`, `DESCRIPTION:${escapeIcs(event.DESCRIPTION || '')}`,
      'LOCATION:Contrast\\, Joseph-Belli-Weg 11\\, 78467 Konstanz\\, Germany',
      `URL:${siteUrl}/events/${event['X-CONTRAST-SLUG']}/`, categories.length ? `CATEGORIES:${categories.map(escapeIcs).join(',')}` : ''
    ].filter(Boolean).join('\r\n') + '\r\nEND:VEVENT';
  }).join('\r\n');
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Contrast Konstanz//Programme//EN\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:Contrast programme\r\n${eventLines}\r\nEND:VCALENDAR\r\n`;
}

function writePublicEventFeeds(events) {
  const eventsData = events.map(publicEvent);
  const venue = { name: 'Contrast', address: 'Joseph-Belli-Weg 11, 78467 Konstanz, Germany', url: siteUrl };
  fs.writeFileSync(path.join(outputDir, 'events.json'), `${JSON.stringify({ version: 1, title: 'Contrast programme', home_page_url: siteUrl, venue, events: eventsData }, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'feed.json'), `${JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title: 'Contrast programme', home_page_url: siteUrl, feed_url: `${siteUrl}/feed.json`, items: eventsData.map((event) => ({ id: event.id, url: event.url, title: event.title, content_text: event.description, date_published: event.startDate, tags: [...event.categories, ...event.tags], image: event.image, authors: event.artists.map((artist) => ({ name: artist.name, url: artist.url || undefined })) })) }, null, 2)}\n`);
  const items = eventsData.map((event) => `    <item><guid isPermaLink="true">${escapeXml(event.url)}</guid><title>${escapeXml(event.title)}</title><link>${escapeXml(event.url)}</link><description>${escapeXml(event.description)}</description><pubDate>${new Date(event.startDate).toUTCString()}</pubDate>${event.categories.map((category) => `<category>${escapeXml(category)}</category>`).join('')}</item>`).join('\n');
  fs.writeFileSync(path.join(outputDir, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Contrast programme</title><link>${siteUrl}/events/</link><description>Upcoming and past events at Contrast Konstanz.</description>\n${items}\n</channel></rss>\n`);
  fs.writeFileSync(path.join(outputDir, 'events.ics'), publicIcs(events));
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
    const artist = artistDirectory.get(artistKey(name));
    const profileUrl = artist ? `./${de ? '' : 'en/'}artists/${artist.slug}/` : '';
    const profile = profileUrl ? `<a href="${profileUrl}">${escapeHtml(name)}</a>` : escapeHtml(name);
    const site = artistUrl ? `<a href="${escapeHtml(artistUrl)}" target="_blank" rel="noopener noreferrer">${de ? 'Offizielle Seite' : 'Official site'} ↗</a>` : '';
    return `<li><strong>${profile}</strong><span>${escapeHtml(bio)}</span>${site}</li>`;
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
  archiveBands.forEach((band) => {
    const era = band.era || (de ? 'Ohne Zuordnung' : 'Unassigned');
    if (!grouped.has(era)) grouped.set(era, []);
    grouped.get(era).push(band);
  });
  const copy = de
    ? { search: 'Bands suchen', searchHint: 'Name eingeben', sort: 'Sortieren', name: 'Name A–Z', newest: 'Datum: neu zuerst', oldest: 'Datum: alt zuerst', noResults: 'Keine passende Band gefunden.' }
    : { search: 'Search bands', searchHint: 'Enter a name', sort: 'Sort', name: 'Name A–Z', newest: 'Date: newest first', oldest: 'Date: oldest first', noResults: 'No matching band found.' };
  const recoveredDate = (value = '') => {
    const date = value.trim();
    return date && !/^date not recovered$/i.test(date) ? `<time>${escapeHtml(date)}</time>` : '';
  };
  const source = (band) => band.sourceUrl
    ? `<a href="${escapeHtml(band.sourceUrl)}" target="_blank" rel="noopener noreferrer">${de ? 'Quelle' : 'Source'} ↗</a>`
    : band.sourceLabel ? `<span class="history-archive__evidence">${escapeHtml(band.sourceLabel)}</span>` : '';
  const mauerbluemchen = de
    ? { title: 'Mauerblümchen', text: 'Die Vorgeschichte des Contrast ist belegt, aber bisher ist keine belastbare Band- oder Programmquelle aus der Mauerblümchen-Zeit aufgetaucht. Dieser Teil des Archivs bleibt bewusst offen, bis Flyer, Programme oder Zeitzeug*innen einen Namen und Zeitraum belegen.', source: 'Zur Ortsgeschichte' }
    : { title: 'Mauerblümchen', text: 'The venue’s history before Contrast is documented, but no reliable band or programme source from the Mauerblümchen period has surfaced yet. This part of the archive deliberately remains open until flyers, programmes or witnesses establish a name and period.', source: 'Venue history' };
  const mauerNote = grouped.has('Mauerblümchen') ? '' : `<section class="history-archive__mauerbluemchen"><p class="section-kicker">${mauerbluemchen.title}</p><p>${mauerbluemchen.text}</p><a href="https://archiv.seemoz.de/lokal_regional/die-provinz-lebt-21-jugendkultur-contrast/" target="_blank" rel="noopener noreferrer">${mauerbluemchen.source} ↗</a></section>`;
  return `<div class="history-archive__controls"><label><span>${copy.search}</span><input type="search" data-history-search placeholder="${copy.searchHint}" autocomplete="off"></label><label><span>${copy.sort}</span><select data-history-sort><option value="name">${copy.name}</option><option value="date-desc">${copy.newest}</option><option value="date-asc">${copy.oldest}</option></select></label></div><p class="history-archive__empty" data-history-empty hidden>${copy.noResults}</p><div class="history-archive__groups">${[...grouped.entries()].map(([era, bands]) => `<details class="history-archive__era"><summary>${escapeHtml(era)} <span data-history-count>${bands.length}</span></summary><ul>${bands.map((band) => `<li data-history-band data-name="${escapeHtml(band.artist.toLocaleLowerCase())}" data-date="${escapeHtml(band.dates || '')}"><strong>${escapeHtml(band.artist)}</strong>${recoveredDate(band.dates)}${source(band)}</li>`).join('')}</ul></details>`).join('')}${mauerNote}</div>`;
}

function archiveBandsFromCalendar(events) {
  const archiveArtistKey = (name = '') => name.trim().toLocaleLowerCase('de').replace(/\s+/g, ' ');
  const known = new Set(historyBands.map((band) => archiveArtistKey(band.artist)));
  const additions = [];
  for (const event of events) {
    if (!/^(true|yes|1)$/i.test(event['X-CONTRAST-ARCHIVE'] || '')) continue;
    const compact = (event.DTSTART || '').replace(/\D/g, '').slice(0, 8);
    if (!/^\d{8}$/.test(compact)) continue;
    const date = `${compact.slice(6, 8)}.${compact.slice(4, 6)}.${compact.slice(0, 4)}`;
    for (const [name] of event.artists) {
      const key = archiveArtistKey(name);
      if (!key || known.has(key)) continue;
      known.add(key);
      additions.push({
        artist: name.trim(),
        era: 'Contrast',
        dates: date,
        sourceUrl: safeExternalUrl(event.URL) || ''
      });
    }
  }
  return [...historyBands, ...additions];
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
  html = html.replace(/\s*<link rel="alternate" type="application\/(?:rss\+xml|feed\+json)"[^>]*>/gi, '');
  html = html.replace(/\s*<meta property="og:[^>]*>/gi, '');
  html = html.replace(/\s*<meta name="twitter:card"[^>]*>/gi, '');
  const socialMeta = `
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="Contrast programme" href="${siteUrl}/feed.xml">
  <link rel="alternate" type="application/feed+json" title="Contrast programme JSON Feed" href="${siteUrl}/feed.json">
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

// The home-page schedule is useful before its JavaScript enhancement has
// loaded (or when a privacy extension blocks it). Keep that fallback in the
// same compact form as the enhanced calendar and mark the Berlin day at build
// time. The client-side calendar refreshes the marker on later days.
function decorateHomeProgrammeFallback(html, locale) {
  const labels = locale === 'de'
    ? ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Berlin' }).format(new Date());
  const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  const mondayIndex = today === 0 ? 6 : today - 1;
  let row = 0;
  return html.replace(
    /<article class="program-row"><p class="program-row__day">[^<]*<\/p>/g,
    () => `<article class="program-row${row === mondayIndex ? ' is-today' : ''}"><p class="program-row__day">${labels[row++]}</p>`
  );
}

// Do this while generating the static documents, rather than after page load.
// Otherwise an Instagram iframe can connect (and log its own errors) before
// the client-side consent replacement gets a chance to remove it.
function replaceInstagramEmbeds(html, locale) {
  const de = locale === 'de';
  const heading = de ? 'Instagram-Inhalt' : 'Instagram content';
  const explanation = de
    ? 'Dieser Inhalt wird von Instagram bereitgestellt. Erst wenn du ihn lädst, wird eine Verbindung zu Meta hergestellt.'
    : 'This content is provided by Instagram. A connection to Meta is made only when you load it.';
  const load = de ? 'Instagram laden' : 'Load Instagram';
  const profile = de ? 'Profil direkt öffnen' : 'Open profile directly';
  const privacy = de ? 'Datenschutzhinweise von Instagram' : 'Instagram privacy policy';
  return html.replace(/<iframe\b[^>]*\bsrc=["'](https:\/\/(?:www\.)?instagram\.com\/[^"'?/]+\/embed\/?)[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi, (_match, embedUrl) => {
    const profileUrl = embedUrl.replace(/\/embed\/?$/, '/');
    return `<section class="instagram-consent" data-embed-url="${embedUrl}" aria-label="${heading}"><div class="instagram-consent__mark" aria-hidden="true">◎</div><h2>${heading}</h2><p>${explanation}</p><button type="button" class="instagram-consent__load">${load}</button><p class="instagram-consent__links"><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${profile}</a><span aria-hidden="true">·</span><a href="https://privacycenter.instagram.com/policy/" target="_blank" rel="noopener noreferrer">${privacy}</a></p></section>`;
  });
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

const calendarEvents = parseIcsEvents().filter((event) => !/^(true|yes|1)$/i.test(event['X-CONTRAST-CLOSURE'] || ''));
const archiveBands = archiveBandsFromCalendar(calendarEvents);

// Locale output is generated from the registry above. German is the canonical
// root language; English lives under /en/. These are static documents, so a
// crawler never depends on JavaScript or browser-language detection.
for (const [locale, localeInfo] of Object.entries(locales)) {
  for (const [routeName, route] of Object.entries(routes)) {
    const content = replaceInstagramEmbeds(localizedContent(route, locale, template), locale)
      .replace('<!-- HISTORY_ARCHIVE -->', historyArchiveMarkup(locale))
      .replace('308 entries', `${archiveBands.length} entries`)
      .replace('308 Einträge', `${archiveBands.length} Einträge`);
    const publicPath = [localeInfo.prefix, route.path].filter(Boolean).join('/');
    const fallback = pages[routeName] || pages.home;
    const page = { ...fallback, path: publicPath };
    let html = template.replace(/<main id="main-content"[\s\S]*?<\/main>/i, `<main id="main-content" tabindex="-1" data-route="${routeName}">${content}</main>`);
    html = setMeta(html, page, !publicPath);
    if (routeName === 'home') html = decorateHomeProgrammeFallback(html, locale);
    html = html.replace('<html lang="en">', `<html lang="${locale}" data-static-locale="${locale}">`);
    const alternates = Object.entries(locales).map(([alternateLocale]) => `  <link rel="alternate" hreflang="${alternateLocale}" href="${localizedUrl(route, alternateLocale)}">`).join('\n');
    html = html.replace('</head>', `${alternates}\n  <link rel="alternate" hreflang="x-default" href="${localizedUrl(route, 'de')}">\n</head>`);
    const destination = path.join(outputDir, publicPath);
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(path.join(destination, 'index.html'), applyContentSecurityPolicy(html));
  }
}

writePublicEventFeeds(calendarEvents);

// Artist pages intentionally stay modest: the programme itself is enough to
// give a small band a useful, durable profile without inventing a biography.
const artistKey = (name = '') => name.trim().toLocaleLowerCase('de').replace(/\s+/g, ' ');
const artistBaseSlug = (name = '') => name.toLocaleLowerCase('de')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'artist';
const artistDirectory = new Map();
const artistSlugs = new Map();

for (const event of calendarEvents) {
  for (const [name, description = '', url = ''] of event.artists) {
    const key = artistKey(name);
    if (!key) continue;
    let artist = artistDirectory.get(key);
    if (!artist) {
      const baseSlug = artistBaseSlug(name);
      const seen = artistSlugs.get(baseSlug) || 0;
      artistSlugs.set(baseSlug, seen + 1);
      artist = { name: name.trim(), slug: seen ? `${baseSlug}-${seen + 1}` : baseSlug, description: '', url: '', events: [] };
      artistDirectory.set(key, artist);
    }
    if (!artist.description && description.trim()) artist.description = description.trim();
    if (!artist.url && safeExternalUrl(url)) artist.url = safeExternalUrl(url);
    artist.events.push(event);
  }
}

for (const artist of artistDirectory.values()) {
  const profile = artistProfiles[artist.name] || artistProfiles[artist.slug];
  if (!profile || typeof profile !== 'object') continue;
  if (profile.description && !artist.description) artist.description = String(profile.description).trim();
  if (profile.url && !artist.url) artist.url = safeExternalUrl(profile.url) || '';
  // Local artwork is opt-in. A missing file simply means the clean text-only profile stays in place.
  if (typeof profile.image === 'string' && /^assets\/images\/artists\/[a-z0-9._/-]+$/i.test(profile.image)) {
    const imageFile = path.join(projectDir, profile.image);
    if (fs.existsSync(imageFile)) artist.image = profile.image;
  }
}

function artistStructuredData(artist, locale = 'de') {
  const localePrefix = locale === 'en' ? 'en/' : '';
  const profileUrl = `${siteUrl}/${localePrefix}artists/${artist.slug}/`;
  return Object.fromEntries(Object.entries({
    '@context': 'https://schema.org',
    '@type': /^dj\b/i.test(artist.name) ? 'Person' : 'MusicGroup',
    '@id': `${profileUrl}#artist`,
    name: artist.name,
    url: profileUrl,
    description: artist.description || undefined,
    sameAs: artist.url || undefined,
    inLanguage: locale
  }).filter(([, value]) => value !== undefined));
}

function artistPage(artist, locale = 'de') {
  const de = locale === 'de';
  const copy = de
    ? { kicker: 'Band- & Künstler*innenarchiv', back: '← Zum Programm', appearances: 'Auftritte im Contrast', noInfo: 'Infos folgen.', official: 'Offizielle Seite ↗' }
    : { kicker: 'Band & artist archive', back: '← Back to programme', appearances: 'Appearances at Contrast', noInfo: 'More information to follow.', official: 'Official site ↗' };
  const format = new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Berlin' });
  const appearances = [...artist.events].sort((a, b) => b.DTSTART.localeCompare(a.DTSTART)).map((event) => `<li><time datetime="${eventIso(event.DTSTART)}">${format.format(eventDate(event.DTSTART))}</time><a href="./${de ? '' : 'en/'}events/${event['X-CONTRAST-SLUG']}/">${escapeHtml(event.SUMMARY)} <span aria-hidden="true">→</span></a></li>`).join('');
  const logo = artist.image ? `<img class="artist-page__logo" src="${escapeHtml(artist.image)}" alt="${escapeHtml(artist.name)}">` : '';
  return `<main id="main-content" tabindex="-1" data-route="artist"><article class="event-page artist-page"><a class="event-page__back" href="./${de ? '' : 'en/'}events/">${copy.back}</a><p class="section-kicker">${copy.kicker}</p><div class="artist-page__heading"><div><h1>${escapeHtml(artist.name)}</h1><p class="event-page__lead">${escapeHtml(artist.description || copy.noInfo)}</p></div>${logo}</div>${artist.url ? `<p class="artist-page__site"><a href="${escapeHtml(artist.url)}" target="_blank" rel="noopener noreferrer">${copy.official}</a></p>` : ''}<section class="event-page__lineup artist-page__appearances"><p class="section-kicker">${copy.appearances}</p><ul>${appearances}</ul></section></article></main>`;
}

function eventsOverviewMarkup(locale = 'de') {
  const de = locale === 'de';
  const now = new Date('2026-10-21T12:00:00+02:00');
  const copy = de
    ? { kicker: '', title: 'Programm', intro: 'Konzerte, Partys, Soli-Abende und alles, was gerade im Contrast passiert.', upcoming: 'Als Nächstes', noUpcoming: 'Neue Termine folgen bald.', past: 'Archiv', search: 'Programm durchsuchen', searchHint: 'Nach Name suchen', includePast: 'Archiv einbeziehen', noResults: 'Keine passenden Einträge gefunden.', subscribe: 'Kalender & Feed', calendar: 'Ganzer Kalender (.ics)', rss: 'RSS-Feed', choose: 'Kalender nach Kategorien herunterladen', download: 'Auswahl herunterladen' }
    : { kicker: 'Programme', title: 'Coming up.', intro: 'Concerts, parties, solidarity events and everything happening at Contrast.', upcoming: 'Coming up', noUpcoming: 'New dates will be announced soon.', past: 'Past events', search: 'Search the programme', searchHint: 'Search by name', includePast: 'Include past events', noResults: 'No matching events found.', subscribe: 'Calendar & feed', calendar: 'Full calendar (.ics)', rss: 'RSS feed', choose: 'Download a calendar by category', download: 'Download selection' };
  const format = new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Berlin' });
  const link = (event) => `./${de ? '' : 'en/'}events/${event['X-CONTRAST-SLUG']}/`;
  const item = (event, past = false) => {
    const index = [event.SUMMARY, event.CATEGORIES, event['X-CONTRAST-SERIES'], event['X-CONTRAST-TYPE'], event['X-CONTRAST-TAGS'], ...event.artists.map(([name, bio]) => `${name} ${bio || ''}`)].filter(Boolean).join(' ').toLocaleLowerCase('de');
    return `<li data-events-item data-events-index="${escapeHtml(index)}"${past ? ' data-events-past-item' : ''}><time datetime="${eventIso(event.DTSTART)}">${format.format(eventDate(event.DTSTART))} · ${eventTime(event.DTSTART)}</time><a href="${link(event)}">${escapeHtml(event.SUMMARY)}</a>${event['X-CONTRAST-PRICE'] ? `<span class="events-overview__price">${escapeHtml(event['X-CONTRAST-PRICE'])}</span>` : ''}</li>`;
  };
  const upcoming = calendarEvents.filter((event) => eventDate(event.DTSTART) >= now).sort((a, b) => a.DTSTART.localeCompare(b.DTSTART));
  const past = calendarEvents.filter((event) => eventDate(event.DTSTART) < now).sort((a, b) => b.DTSTART.localeCompare(a.DTSTART));
  const categories = [...new Set(calendarEvents.flatMap((event) => (event.CATEGORIES || event['X-CONTRAST-SERIES'] || '').split(',').map((value) => value.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b, de ? 'de' : 'en'));
  const feeds = `<section class="events-feeds" aria-label="${copy.subscribe}"><p class="section-kicker">${copy.subscribe}</p><div class="events-feeds__links"><a href="./events.ics">${copy.calendar} ↓</a><a href="./feed.xml">${copy.rss} ↗</a></div><form class="events-feeds__picker" data-calendar-picker><fieldset><legend>${copy.choose}</legend><div>${categories.map((category) => `<label><input type="checkbox" value="${escapeHtml(category)}" checked> ${escapeHtml(category)}</label>`).join('')}</div></fieldset><button type="submit">${copy.download} ↓</button></form></section>`;
  return `<main id="main-content" tabindex="-1" data-route="events"><section class="events-overview__hero">${copy.kicker ? `<p class="section-kicker">${copy.kicker}</p>` : ''}<h1>${copy.title}</h1><p>${copy.intro}</p><div class="events-overview__search"><label><span>${copy.search}</span><input type="search" data-events-search placeholder="${copy.searchHint}" autocomplete="off"></label><label class="events-overview__include"><input type="checkbox" data-events-include-past><span>${copy.includePast}</span></label><p class="events-overview__empty" data-events-empty hidden>${copy.noResults}</p></div></section><section class="events-overview" aria-labelledby="events-upcoming"><p class="section-kicker" id="events-upcoming">${copy.upcoming}</p>${upcoming.length ? `<ul class="events-overview__list" data-events-upcoming-list>${upcoming.map((event) => item(event)).join('')}</ul>` : `<p class="events-overview__empty">${copy.noUpcoming}</p>`}</section><section class="events-overview events-overview--past"><details><summary>${copy.past} <span>${past.length}</span></summary><div><ul class="events-overview__list" data-events-past-list>${past.map((event) => item(event, true)).join('')}</ul></div></details></section>${feeds}</main>`;
}

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

for (const artist of artistDirectory.values()) {
  for (const locale of ['de', 'en']) {
    const localePrefix = locale === 'en' ? 'en/' : '';
    const page = {
      path: `${localePrefix}artists/${artist.slug}`,
      title: `${artist.name} | Contrast Konstanz`,
      description: (artist.description || `${artist.name} ${locale === 'de' ? 'im Contrast Konstanz.' : 'at Contrast Konstanz.'}`).slice(0, 155),
      image: 'assets/images/venue/contrast-venue-04.jpg'
    };
    let html = template.replace(/<main id="main-content"[\s\S]*?<\/main>/i, artistPage(artist, locale));
    html = setMeta(html, page, false);
    html = html.replace('<html lang="en">', `<html lang="${locale}" data-static-locale="${locale}">`);
    html = html.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(artistStructuredData(artist, locale))}</script>\n</head>`);
    const routeDir = path.join(outputDir, page.path);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), applyContentSecurityPolicy(html));
  }
}

for (const locale of ['de', 'en']) {
  const localePrefix = locale === 'en' ? 'en/' : '';
  const page = {
    path: `${localePrefix}events`,
    title: locale === 'de' ? 'Programm & Veranstaltungen | Contrast Konstanz' : 'Programme & events | Contrast Konstanz',
    description: locale === 'de' ? 'Kommende und vergangene Veranstaltungen im Contrast Konstanz.' : 'Upcoming and past events at Contrast Konstanz.',
    image: 'assets/images/venue/contrast-venue-04.jpg'
  };
  let html = template.replace(/<main id="main-content"[\s\S]*?<\/main>/i, eventsOverviewMarkup(locale));
  html = setMeta(html, page, false);
  html = html.replace('<html lang="en">', `<html lang="${locale}" data-static-locale="${locale}">`);
  const routeDir = path.join(outputDir, page.path);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), applyContentSecurityPolicy(html));
}

const sitemapUrls = [
  ...Object.values(pages).map((page) => `${siteUrl}/${page.path ? `${page.path}/` : ''}`),
  `${siteUrl}/events/`,
  `${siteUrl}/en/events/`,
  ...calendarEvents.flatMap((event) => [`${siteUrl}/events/${event['X-CONTRAST-SLUG']}/`, `${siteUrl}/en/events/${event['X-CONTRAST-SLUG']}/`]),
  ...[...artistDirectory.values()].flatMap((artist) => [`${siteUrl}/artists/${artist.slug}/`, `${siteUrl}/en/artists/${artist.slug}/`])
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

console.log(`Generated ${Object.keys(pages).length + calendarEvents.length + artistDirectory.size} indexable routes in dist/.`);

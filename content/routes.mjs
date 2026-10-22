// Single registry for all localized content. The renderer owns layout, routes,
// metadata and hreflang; locale files contain only page-specific copy/markup.
export const locales = {
  de: { prefix: '', language: 'de_DE', label: 'DE', contentDirectory: 'pages/de' },
  en: { prefix: 'en', language: 'en_GB', label: 'EN', contentDirectory: 'pages' }
};

export const routes = {
  home: { path: '', files: { de: 'home.html', en: '__index__' } },
  About: { path: 'About', files: { de: 'About.html', en: 'About.html' } },
  Archiv: { path: 'Archiv', files: { de: 'Archiv.html', en: 'Archiv.html' } },
  'Queer-Kneipe': { path: 'Queer-Kneipe', files: { de: 'Queer-Kneipe.html', en: 'Queer-Kneipe.html' } },
  'Das-Labor': { path: 'Das-Labor', files: { de: 'Das-Labor.html', en: 'Das-Labor.html' } },
  'Punk-Kneipe': { path: 'Punk-Kneipe', files: { de: 'Punk-Kneipe.html', en: 'Punk-Kneipe.html' } },
  'Info-Kneipe': { path: 'Info-Kneipe', files: { de: 'Info-Kneipe.html', en: 'Info-Kneipe.html' } },
  'Kunst-Kneipe': { path: 'Kunst-Kneipe', files: { de: 'Kunst-Kneipe.html', en: 'Kunst-Kneipe.html' } },
  Spieleabend: { path: 'Spieleabend', files: { de: 'Spieleabend.html', en: 'Spieleabend.html' } },
  mitglied: { path: 'mitglied', files: { de: 'mitglied.html', en: 'mitglied.html' } },
  Kontakt: { path: 'Kontakt', files: { de: 'Kontakt.html', en: 'Kontakt.html' } }
};

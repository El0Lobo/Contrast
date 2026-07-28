import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './generate-asset-manifest.mjs';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectDir, 'dist');
const siteUrl = 'https://contrast-kn.de';

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
    image: 'assets/icons/events/queer-kneipe.png'
  },
  'Das-Labor': {
    path: 'Das-Labor',
    content: 'Das-Labor.html',
    title: 'The Lab – experimental music in Konstanz | Contrast',
    description: 'Electronic sounds, experimental music and creative performances every Tuesday at Contrast Konstanz.',
    image: 'assets/icons/events/das-labor.png'
  },
  'Punk-Kneipe': {
    path: 'Punk-Kneipe',
    content: 'Punk-Kneipe.html',
    title: 'Punk Night in Konstanz | Contrast',
    description: 'Punk, community and affordable drinks every Thursday at Punk Night in Contrast Konstanz.',
    image: 'assets/icons/events/punk-kneipe.png'
  },
  'Info-Kneipe': {
    path: 'Info-Kneipe',
    content: 'Info-Kneipe.html',
    title: 'Info Night – Talks & Discussion | Contrast Konstanz',
    description: 'Talks and discussions about politics, society, the environment and culture at Info Night in Contrast Konstanz.',
    image: 'assets/icons/events/info-kneipe.png'
  },
  'Kunst-Kneipe': {
    path: 'Kunst-Kneipe',
    content: 'Kunst-Kneipe.html',
    title: 'Art Night in Konstanz | Contrast',
    description: 'Experience art, get creative together and meet local artists at Art Night in Contrast Konstanz.',
    image: 'assets/icons/events/kunstkneipe2.png'
  },
  Spieleabend: {
    path: 'Spieleabend',
    content: 'Spieleabend.html',
    title: 'Games Night in Konstanz | Contrast',
    description: 'Board games, card games and an open community at Games Night in Contrast Konstanz.',
    image: 'assets/icons/events/spieleabend.png'
  },
  mitglied: {
    path: 'mitglied',
    content: 'mitglied.html',
    title: 'Become a Member | Contrast Konstanz',
    description: 'Become a Contrast member and help shape alternative music, art, culture and community events in Konstanz.',
    image: 'assets/images/membership-poster.png'
  },
  Kontakt: {
    path: 'Kontakt',
    content: 'Kontakt.html',
    title: 'Contact, Directions & Opening Hours | Contrast Konstanz',
    description: 'Address, directions, opening hours and booking contact for Contrast at Joseph-Belli-Weg 11 in Konstanz.',
    image: 'assets/images/map.png'
  }
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${siteUrl}/#contrast`,
  name: 'Contrast',
  url: `${siteUrl}/`,
  logo: `${siteUrl}/assets/images/logo-original.png`,
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

function mainMarkup(contentFile) {
  const content = fs.readFileSync(path.join(projectDir, 'pages', contentFile), 'utf8');
  const match = content.match(/<main(?:\s[^>]*)?>([\s\S]*?)<\/main>/i);
  if (!match) throw new Error(`No <main> found in pages/${contentFile}`);
  const route = contentFile.replace(/\.html$/, '');
  return `<main id="main-content" tabindex="-1" data-route="${route}">${match[1]}</main>`;
}

function setMeta(html, page, isRoot) {
  const canonical = `${siteUrl}/${page.path ? `${page.path}/` : ''}`;
  const image = `${siteUrl}/${page.image}`;
  const base = isRoot ? '' : '  <base href="../">\n';
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

if (fs.existsSync(outputDir)) {
  fs.rmdirSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir, { recursive: true });
copyDirectory(path.join(projectDir, 'assets'), path.join(outputDir, 'assets'));
copyDirectory(path.join(projectDir, 'Contrast Material'), path.join(outputDir, 'Contrast Material'));
copyDirectory(path.join(projectDir, 'pages'), path.join(outputDir, 'pages'));
fs.copyFileSync(path.join(projectDir, 'robots.txt'), path.join(outputDir, 'robots.txt'));
fs.copyFileSync(path.join(projectDir, 'sitemap.xml'), path.join(outputDir, 'sitemap.xml'));
fs.copyFileSync(path.join(projectDir, 'asset-browser.html'), path.join(outputDir, 'asset-browser.html'));

let template = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
template = setMeta(template, pages.home, true);
fs.writeFileSync(path.join(outputDir, 'index.html'), template);

for (const [route, page] of Object.entries(pages)) {
  if (route === 'home') continue;
  let html = template.replace(/<main id="main-content"[\s\S]*?<\/main>/i, mainMarkup(page.content));
  html = setMeta(html, page, false);
  const routeDir = path.join(outputDir, page.path);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
}

console.log(`Generated ${Object.keys(pages).length} indexable routes in dist/.`);

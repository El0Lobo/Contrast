import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(projectDir, 'assets');
const materialDir = path.join(projectDir, 'Contrast Material');
const outputFile = path.join(assetsDir, 'js', 'asset-manifest.js');
const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif']);
const codeExtensions = new Set(['css', 'js', 'map']);
const documentExtensions = new Set(['pdf', 'indd', 'idml', 'txt']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

function sizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const manifest = [...walk(assetsDir), ...walk(materialDir)]
  .filter(file => file !== outputFile)
  .map(file => {
    const relativePath = path.relative(projectDir, file).split(path.sep).join('/');
    const extension = path.extname(file).slice(1).toLowerCase() || 'file';
    return {
      name: path.basename(file),
      path: relativePath,
      extension,
      collection: relativePath.startsWith('assets/') ? 'website' : 'contrast-material',
      isIcon: relativePath.startsWith('assets/icons/') || relativePath.includes('/Vector/'),
      kind: imageExtensions.has(extension)
        ? 'image'
        : codeExtensions.has(extension)
          ? 'code'
          : documentExtensions.has(extension)
            ? 'document'
            : 'metadata',
      sizeLabel: sizeLabel(fs.statSync(file).size)
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

fs.writeFileSync(outputFile, `window.CONTRAST_ASSETS = ${JSON.stringify(manifest, null, 2)};\n`);
console.log(`Indexed ${manifest.length} assets.`);

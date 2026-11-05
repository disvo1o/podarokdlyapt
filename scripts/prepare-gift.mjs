import fs from 'node:fs/promises';
import path from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('Usage: npm run prepare:gift -- /absolute/path/to/book.memoria');
  process.exit(1);
}
const raw = JSON.parse(await fs.readFile(source, 'utf8'));
if (raw?.format !== 'memoria' || !Array.isArray(raw.pages) || raw.pages.length < 3 || !Array.isArray(raw.tracks)) {
  throw new Error('The source must be a Memoria export (.memoria)');
}
for (const page of raw.pages) {
  if (!Array.isArray(page.photos)) throw new Error('Invalid page photos');
  for (const photo of page.photos) {
    if (typeof photo.src !== 'string' || !/^((data:image\/)|\/photos\/)/.test(photo.src)) throw new Error('Invalid photo source');
  }
}
for (const track of raw.tracks) {
  if (typeof track.src !== 'string' || !/^((data:audio\/)|\/a-small-moment\.wav)/.test(track.src)) throw new Error('Invalid audio source');
}
const destination = path.resolve('public/book.json');
await fs.writeFile(destination, JSON.stringify({format:'memoria',version:1,title:String(raw.title || 'Фотокнига'),pages:raw.pages,tracks:raw.tracks}));
console.log(`Prepared ${destination}`);
console.log('Next: npm run build:gift');

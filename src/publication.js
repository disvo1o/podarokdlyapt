export const VIEW_ONLY = import.meta.env.VITE_VIEW_ONLY === 'true';

const normalize = value => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('ru')
  .replace(/\\s+/g, ' ');

export function validateBook(book) {
  if (book?.format !== 'memoria' || !Array.isArray(book.pages) || book.pages.length < 3 ||
      book.pages.some(page => !Array.isArray(page.photos)) || !Array.isArray(book.tracks ?? [])) {
    throw new Error('Invalid published book');
  }

  // Hide repeated copies in the published edition without modifying the source archive.
  const seenPhotos = new Set();
  const pages = book.pages.map(page => ({
    ...page,
    photos: page.photos.filter(photo => {
      const key = typeof photo.src === 'string' ? photo.src.trim() : '';
      if (!key) return true;
      if (seenPhotos.has(key)) return false;
      seenPhotos.add(key);
      return true;
    })
  }));

  const seenTracks = new Set();
  const tracks = (book.tracks ?? []).filter(track => {
    const src = typeof track.src === 'string' ? track.src.trim() : '';
    const title = normalize(track.name);
    const artist = normalize(track.artist);
    const identity = src ? 'src:' + src : 'meta:' + title + '|' + artist;
    if (seenTracks.has(identity)) return false;
    seenTracks.add(identity);
    return true;
  });

  return { ...book, pages, tracks };
}

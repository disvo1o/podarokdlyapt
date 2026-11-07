export const VIEW_ONLY = import.meta.env.VITE_VIEW_ONLY === 'true';

const normalize = value => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('ru')
  .replace(/\\s+/g, ' ');

export function validateBook(book) {
  if (book?.format !== 'memoria' || !Array.isArray(book.pages) || book.pages.length < 3 ||
      book.pages.some(page => !Array.isArray(page.photos)) || !Array.isArray(book.tracks ?? [])) {
    throw new Error('Invalid published book');
  }

  // Remove repeated photo sources across the whole published album.
  const seenPhotos = new Set();
  const pages = book.pages.map(page => ({
    ...page,
    photos: page.photos.filter(photo => {
      const src = typeof photo.src === 'string' ? photo.src.trim() : '';
      if (!src) return true;
      if (seenPhotos.has(src)) return false;
      seenPhotos.add(src);
      return true;
    })
  }));

  // A track is a duplicate if either its audio source or its title + artist repeats.
  const seenTrackSources = new Set();
  const seenTrackMetadata = new Set();
  const tracks = (book.tracks ?? []).filter(track => {
    const src = typeof track.src === 'string' ? track.src.trim() : '';
    const title = normalize(track.name);
    const artist = normalize(track.artist);
    const metadata = title ? title + '|' + artist : '';
    if ((src && seenTrackSources.has(src)) || (metadata && seenTrackMetadata.has(metadata))) return false;
    if (src) seenTrackSources.add(src);
    if (metadata) seenTrackMetadata.add(metadata);
    return true;
  });

  return { ...book, pages, tracks };
}

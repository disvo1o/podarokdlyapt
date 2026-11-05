// Keep file order while bounding simultaneous reads/decodes for large imports.
export async function processFiles(files, worker, onProgress = () => {}, concurrency = 3) {
  const results = new Array(files.length);
  let next = 0, done = 0;
  await Promise.all(Array.from({length: Math.min(concurrency, files.length)}, async () => {
    while (next < files.length) {
      const index = next++;
      try { results[index] = {status: 'fulfilled', value: await worker(files[index])}; }
      catch (reason) { results[index] = {status: 'rejected', reason, file: files[index]}; }
      onProgress(++done, files.length);
    }
  }));
  return results;
}
export function arrangePhotos(photos) {
  const columns = photos.length === 1 ? 1 : 2;
  const rows = Math.ceil(photos.length / columns);
  const gap = 4, width = (84 - gap * (columns - 1)) / columns;
  const height = (76 - gap * (rows - 1)) / rows;
  return photos.map((photo, i) => ({...photo, x: 8 + (i % columns) * (width + gap), y: 8 + Math.floor(i / columns) * (height + gap), w: width, h: height}));
}
export function insertPhotoPages(pages, photos, target, perPage, makeId) {
  const added = [];
  for (let i = 0; i < photos.length; i += perPage) {
    added.push({id: makeId(), bg: '#fbfaf6', photos: arrangePhotos(photos.slice(i, i + perPage)), caption: '', location: ''});
  }
  const at = Math.max(1, Math.min(target + 1, pages.length - 1));
  return {pages: [...pages.slice(0, at), ...added, ...pages.slice(at)], first: at, count: added.length};
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('File could not be read'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be decoded'));
    image.src = src;
  });
}

/** Keep the full frame, but reduce oversized uploads before they enter IndexedDB. */
export async function compressImageFile(file, {maxBytes = 2.5 * 1024 * 1024, maxEdge = 3000, quality = 0.86} = {}) {
  const source = await fileToDataUrl(file);
  if (file.size <= maxBytes) return {src: source, compressed: false, originalBytes: file.size, finalBytes: file.size};
  const image = await loadImage(source);
  const longest = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const scale = Math.min(1, maxEdge / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  canvas.getContext('2d', {alpha: true}).drawImage(image, 0, 0, canvas.width, canvas.height);
  image.src = '';
  let output = canvas.toDataURL('image/webp', quality);
  if (!output.startsWith('data:image/')) output = canvas.toDataURL('image/jpeg', quality);
  const finalBytes = Math.max(0, Math.round((output.length - output.indexOf(',') - 1) * 0.75));
  canvas.width=canvas.height=0;
  return finalBytes < file.size ? {src: output, compressed: true, originalBytes: file.size, finalBytes} : {src: source, compressed: false, originalBytes: file.size, finalBytes: file.size};
}

export const VIEW_ONLY = import.meta.env.VITE_VIEW_ONLY === 'true';
export function validateBook(book) {
  if (book?.format !== 'memoria' || !Array.isArray(book.pages) || book.pages.length < 3 ||
      book.pages.some(page => !Array.isArray(page.photos)) || !Array.isArray(book.tracks ?? [])) {
    throw new Error('Invalid published book');
  }
  return book;
}

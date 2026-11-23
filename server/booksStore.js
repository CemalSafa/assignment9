const INITIAL_BOOKS = Object.freeze([
  Object.freeze({
    id: 1,
    title: 'Dune',
    author: 'Frank Herbert',
    year: 1965,
    genre: 'science',
    read: true,
    rating: 5,
  }),
  Object.freeze({
    id: 2,
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    year: 2007,
    genre: 'fantasy',
    read: true,
    rating: 4,
  }),
  Object.freeze({
    id: 3,
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    year: 2011,
    genre: 'history',
    read: false,
    rating: null,
  }),
  Object.freeze({
    id: 4,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    year: 1960,
    genre: 'fiction',
    read: true,
    rating: 5,
  }),
  Object.freeze({
    id: 5,
    title: 'Atomic Habits',
    author: 'James Clear',
    year: 2018,
    genre: 'non-fiction',
    read: false,
    rating: null,
  }),
  Object.freeze({
    id: 6,
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    year: 1969,
    genre: 'fantasy',
    read: false,
    rating: null,
  }),
]);

let books = INITIAL_BOOKS.map((book) => ({ ...book }));
let nextId = INITIAL_BOOKS.reduce((max, book) => Math.max(max, book.id), 0) + 1;

function delay(ms = 25) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneBook(book) {
  return { ...book };
}

export async function getAllBooks() {
  await delay();
  return books.map(cloneBook);
}

export async function getBookById(id) {
  await delay();
  const found = books.find((book) => book.id === id);
  return found ? cloneBook(found) : null;
}

export async function createBook(bookData) {
  await delay();
  const newBook = {
    id: nextId,
    title: bookData.title,
    author: bookData.author,
    year: bookData.year,
    genre: bookData.genre,
    read: bookData.read ?? false,
    rating: bookData.rating ?? null,
  };

  nextId += 1;
  books = [...books, newBook];
  return cloneBook(newBook);
}

export async function replaceBook(id, bookData) {
  await delay();
  const index = books.findIndex((book) => book.id === id);
  if (index === -1) {
    return null;
  }

  const updatedBook = {
    id,
    title: bookData.title,
    author: bookData.author,
    year: bookData.year,
    genre: bookData.genre,
    read: bookData.read ?? false,
    rating: bookData.rating ?? null,
  };

  books = books.map((book, i) => (i === index ? updatedBook : book));
  return cloneBook(updatedBook);
}

export async function updateBook(id, mergedData) {
  await delay();
  const index = books.findIndex((book) => book.id === id);
  if (index === -1) {
    return null;
  }

  const updatedBook = {
    ...books[index],
    title: mergedData.title,
    author: mergedData.author,
    year: mergedData.year,
    genre: mergedData.genre,
    read: mergedData.read,
    rating: mergedData.rating,
    id,
  };

  books = books.map((book, i) => (i === index ? updatedBook : book));
  return cloneBook(updatedBook);
}

export async function deleteBook(id) {
  await delay();
  const exists = books.some((book) => book.id === id);
  if (!exists) {
    return false;
  }

  books = books.filter((book) => book.id !== id);
  return true;
}

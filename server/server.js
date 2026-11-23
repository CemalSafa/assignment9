import express from 'express';
import cors from 'cors';
import {
  getAllBooks,
  getBookById,
  createBook,
  replaceBook,
  updateBook,
  deleteBook,
} from './booksStore.js';
import {
  parsePositiveInt,
  validateFullBookBody,
  validatePatchBook,
  validateBooksQuery,
} from './validate.js';

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  return next(err);
});

function hasDuplicateTitleAuthor(books, title, author, excludeId = null) {
  const targetTitle = title.trim().toLowerCase();
  const targetAuthor = author.trim().toLowerCase();
  return books.some(
    (book) =>
      book.id !== excludeId &&
      book.title.trim().toLowerCase() === targetTitle &&
      book.author.trim().toLowerCase() === targetAuthor
  );
}

function sortBooksCopy(books, sort, order) {
  const copy = [...books];
  const factor = order === 'desc' ? -1 : 1;

  if (sort === 'rating') {
    const rated = copy.filter((book) => book.rating !== null);
    const unrated = copy.filter((book) => book.rating === null);

    rated.sort((a, b) => {
      if (a.rating !== b.rating) {
        return (a.rating - b.rating) * factor;
      }
      return (a.id - b.id) * factor;
    });

    return [...rated, ...unrated];
  }

  copy.sort((a, b) => {
    if (sort === 'year') {
      if (a.year !== b.year) {
        return (a.year - b.year) * factor;
      }
      return (a.id - b.id) * factor;
    }

    if (sort === 'title' || sort === 'author') {
      const cmp = a[sort].localeCompare(b[sort], undefined, { sensitivity: 'base' });
      if (cmp !== 0) {
        return cmp * factor;
      }
      return (a.id - b.id) * factor;
    }

    return (a.id - b.id) * factor;
  });

  return copy;
}

app.get('/api/crash', async (req, res, next) => {
  try {
    await Promise.resolve();
    throw new Error('Intentional async test crash');
  } catch (err) {
    return next(err);
  }
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const books = await getAllBooks();
    const total = books.length;
    const readCount = books.filter((book) => book.read).length;
    const unreadCount = total - readCount;

    const ratedBooks = books.filter((book) => book.rating !== null);
    const averageRating =
      ratedBooks.length > 0
        ? Number(
            (
              ratedBooks.reduce((sum, book) => sum + book.rating, 0) / ratedBooks.length
            ).toFixed(1)
          )
        : null;

    const byGenre = {};
    for (const book of books) {
      byGenre[book.genre] = (byGenre[book.genre] ?? 0) + 1;
    }

    return res.status(200).json({
      total,
      read: readCount,
      unread: unreadCount,
      averageRating,
      byGenre,
    });
  } catch (err) {
    return next(err);
  }
});

app.get('/api/books', async (req, res, next) => {
  try {
    const queryValidation = validateBooksQuery(req.query);
    if (queryValidation.error) {
      return res.status(400).json({ error: queryValidation.error });
    }

    const { genre, read, q, sort, order, limit, page } = queryValidation.value;
    let list = await getAllBooks();

    if (genre !== null) {
      list = list.filter((book) => book.genre === genre);
    }

    if (read !== null) {
      list = list.filter((book) => book.read === read);
    }

    if (q.length > 0) {
      list = list.filter(
        (book) =>
          book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q)
      );
    }

    const sorted = sortBooksCopy(list, sort, order);
    const startIndex = (page - 1) * limit;
    const paginated = sorted.slice(startIndex, startIndex + limit);

    return res.status(200).json(paginated);
  } catch (err) {
    return next(err);
  }
});

app.get('/api/books/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Book id must be a positive integer' });
    }

    const book = await getBookById(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (err) {
    return next(err);
  }
});

app.post('/api/books', async (req, res, next) => {
  try {
    const validation = validateFullBookBody(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const existingBooks = await getAllBooks();
    if (hasDuplicateTitleAuthor(existingBooks, validation.value.title, validation.value.author)) {
      return res.status(409).json({
        error: 'A book with the same title and author already exists',
      });
    }

    const created = await createBook(validation.value);
    return res
      .status(201)
      .location(`/api/books/${created.id}`)
      .json(created);
  } catch (err) {
    return next(err);
  }
});

app.put('/api/books/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Book id must be a positive integer' });
    }

    const currentBook = await getBookById(id);
    if (!currentBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const validation = validateFullBookBody(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const existingBooks = await getAllBooks();
    if (
      hasDuplicateTitleAuthor(
        existingBooks,
        validation.value.title,
        validation.value.author,
        id
      )
    ) {
      return res.status(409).json({
        error: 'A book with the same title and author already exists',
      });
    }

    const replaced = await replaceBook(id, validation.value);
    return res.status(200).json(replaced);
  } catch (err) {
    return next(err);
  }
});

app.patch('/api/books/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Book id must be a positive integer' });
    }

    const currentBook = await getBookById(id);
    if (!currentBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const validation = validatePatchBook(currentBook, req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const existingBooks = await getAllBooks();
    if (
      hasDuplicateTitleAuthor(
        existingBooks,
        validation.value.title,
        validation.value.author,
        id
      )
    ) {
      return res.status(409).json({
        error: 'A book with the same title and author already exists',
      });
    }

    const updated = await updateBook(id, validation.value);
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/books/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Book id must be a positive integer' });
    }

    const deleted = await deleteBook(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

app.use('/api', (req, res) => {
  return res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

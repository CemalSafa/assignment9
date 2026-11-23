import { useCallback, useEffect, useState } from 'react';
import {
  createBookApi,
  deleteBookApi,
  fetchBooks,
  fetchStats,
  patchBookApi,
  replaceBookApi,
} from './api/books';
import StatsPanel from './components/StatsPanel';
import BookFilters from './components/BookFilters';
import BookForm from './components/BookForm';
import BookList from './components/BookList';

export default function App() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [booksError, setBooksError] = useState('');
  const [actionError, setActionError] = useState('');

  const [bookToEdit, setBookToEdit] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [busyBookId, setBusyBookId] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const loadStats = useCallback(async (signal) => {
    setLoadingStats(true);
    try {
      const data = await fetchStats(signal);
      if (!signal?.aborted) {
        setStats(data);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!signal?.aborted) {
        setActionError((prev) => prev || err.message);
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingStats(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooksAndStats() {
      setLoadingBooks(true);
      setBooksError('');

      const query = {
        q: searchQuery.trim() || undefined,
        genre: genreFilter || undefined,
        read: readFilter || undefined,
        sort: sortField,
        order: sortOrder,
      };

      try {
        const list = await fetchBooks(query, controller.signal);
        if (!controller.signal.aborted) {
          setBooks(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setBooksError(err.message);
          setBooks([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBooks(false);
        }
      }

      await loadStats(controller.signal);
    }

    loadBooksAndStats();

    return () => {
      controller.abort();
    };
  }, [searchQuery, genreFilter, readFilter, sortField, sortOrder, reloadTick, loadStats]);

  function handleResetFilters() {
    setSearchQuery('');
    setGenreFilter('');
    setReadFilter('');
    setSortField('id');
    setSortOrder('asc');
  }

  async function handleFormSubmit(formPayload) {
    setSubmittingForm(true);
    setActionError('');

    try {
      if (bookToEdit) {
        const updatedBook = await replaceBookApi(bookToEdit.id, formPayload);
        setBooks((prev) =>
          prev.map((item) => (item.id === updatedBook.id ? updatedBook : item))
        );
        setBookToEdit(null);
      } else {
        const createdBook = await createBookApi(formPayload);
        setBooks((prev) => [...prev, createdBook]);
      }

      setReloadTick((prev) => prev + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmittingForm(false);
    }
  }

  async function handleToggleRead(book, nextRead) {
    setBusyBookId(book.id);
    setActionError('');

    const patchPayload = nextRead
      ? { read: true }
      : { read: false, rating: null };

    try {
      const updatedBook = await patchBookApi(book.id, patchPayload);
      setBooks((prev) =>
        prev.map((item) => (item.id === updatedBook.id ? updatedBook : item))
      );
      setReloadTick((prev) => prev + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyBookId(null);
    }
  }

  async function handleChangeRating(book, nextRating) {
    setBusyBookId(book.id);
    setActionError('');

    try {
      const updatedBook = await patchBookApi(book.id, { rating: nextRating });
      setBooks((prev) =>
        prev.map((item) => (item.id === updatedBook.id ? updatedBook : item))
      );
      setReloadTick((prev) => prev + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyBookId(null);
    }
  }

  async function handleDeleteBook(bookId) {
    setBusyBookId(bookId);
    setActionError('');

    try {
      await deleteBookApi(bookId);
      setBooks((prev) => prev.filter((item) => item.id !== bookId));
      if (bookToEdit && bookToEdit.id === bookId) {
        setBookToEdit(null);
      }
      setReloadTick((prev) => prev + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyBookId(null);
    }
  }

  return (
    <main>
      <h1>Reading List</h1>

      {actionError && (
        <div role="alert">
          <strong>Error:</strong> {actionError}
        </div>
      )}

      <StatsPanel stats={stats} loading={loadingStats} />

      <hr />

      <BookFilters
        searchQuery={searchQuery}
        genreFilter={genreFilter}
        readFilter={readFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        onSearchChange={setSearchQuery}
        onGenreChange={setGenreFilter}
        onReadChange={setReadFilter}
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onResetFilters={handleResetFilters}
      />

      <hr />

      <BookForm
        bookToEdit={bookToEdit}
        submitting={submittingForm}
        onSubmitBook={handleFormSubmit}
        onCancelEdit={() => setBookToEdit(null)}
      />

      <hr />

      <BookList
        books={books}
        loading={loadingBooks}
        error={booksError}
        busyBookId={busyBookId}
        onStartEdit={(book) => {
          setActionError('');
          setBookToEdit(book);
        }}
        onToggleRead={handleToggleRead}
        onChangeRating={handleChangeRating}
        onDeleteBook={handleDeleteBook}
      />
    </main>
  );
}

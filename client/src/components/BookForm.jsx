import { useEffect, useState } from 'react';

const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];

function getInitialFormState(bookToEdit) {
  if (!bookToEdit) {
    return {
      title: '',
      author: '',
      year: '',
      genre: 'fiction',
      read: false,
      rating: '',
    };
  }

  return {
    title: bookToEdit.title ?? '',
    author: bookToEdit.author ?? '',
    year: String(bookToEdit.year ?? ''),
    genre: bookToEdit.genre ?? 'fiction',
    read: Boolean(bookToEdit.read),
    rating: bookToEdit.rating !== null && bookToEdit.rating !== undefined ? String(bookToEdit.rating) : '',
  };
}

export default function BookForm({ bookToEdit, submitting, onSubmitBook, onCancelEdit }) {
  const [form, setForm] = useState(() => getInitialFormState(bookToEdit));

  useEffect(() => {
    setForm(getInitialFormState(bookToEdit));
  }, [bookToEdit]);

  function handleReadChange(checked) {
    setForm((prev) => ({
      ...prev,
      read: checked,
      rating: checked ? prev.rating : '',
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const parsedYear = form.year.trim() === '' ? null : Number(form.year);
    let parsedRating = null;
    if (form.read && form.rating !== '') {
      parsedRating = Number(form.rating);
    }

    onSubmitBook({
      title: form.title,
      author: form.author,
      year: parsedYear,
      genre: form.genre,
      read: form.read,
      rating: parsedRating,
    });
  }

  const isEditing = Boolean(bookToEdit);

  return (
    <section aria-label={isEditing ? 'Edit book' : 'Add book'}>
      <h2>{isEditing ? `Edit Book #${bookToEdit.id} (PUT)` : 'Add New Book (POST)'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="book-title">Title: </label>
          <input
            id="book-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label htmlFor="book-author">Author: </label>
          <input
            id="book-author"
            type="text"
            value={form.author}
            onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label htmlFor="book-year">Year: </label>
          <input
            id="book-year"
            type="number"
            value={form.year}
            onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label htmlFor="book-genre">Genre: </label>
          <select
            id="book-genre"
            value={form.genre}
            onChange={(e) => setForm((prev) => ({ ...prev, genre: e.target.value }))}
            disabled={submitting}
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="book-read">
            <input
              id="book-read"
              type="checkbox"
              checked={form.read}
              onChange={(e) => handleReadChange(e.target.checked)}
              disabled={submitting}
            />{' '}
            Read
          </label>
        </div>

        <div>
          <label htmlFor="book-rating">Rating (1–5, only when read): </label>
          <select
            id="book-rating"
            value={form.rating}
            onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
            disabled={submitting || !form.read}
          >
            <option value="">No rating (null)</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div>
          <button type="submit" disabled={submitting}>
            {submitting
              ? 'Saving...'
              : isEditing
                ? 'Save Changes (PUT)'
                : 'Add Book'}
          </button>
          {isEditing && (
            <button type="button" onClick={onCancelEdit} disabled={submitting}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

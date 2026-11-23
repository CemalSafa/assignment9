export default function BookList({
  books,
  loading,
  error,
  busyBookId,
  onStartEdit,
  onToggleRead,
  onChangeRating,
  onDeleteBook,
}) {
  return (
    <section aria-label="Books list">
      <h2>Books</h2>

      {loading && <p>Loading books...</p>}
      {!loading && error && <p role="alert">Error: {error}</p>}
      {!loading && !error && books.length === 0 && <p>No books match the current criteria.</p>}

      {!loading && !error && books.length > 0 && (
        <ul>
          {books.map((book) => {
            const isRowBusy = busyBookId === book.id;

            return (
              <li key={book.id}>
                <div>
                  <strong>{book.title}</strong> — {book.author} ({book.year}) [{book.genre}]
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={book.read}
                      disabled={isRowBusy}
                      onChange={(e) => onToggleRead(book, e.target.checked)}
                    />{' '}
                    Read
                  </label>

                  <label>
                    {' '}
                    | Rating:{' '}
                    <select
                      value={book.rating === null ? '' : String(book.rating)}
                      disabled={isRowBusy || !book.read}
                      onChange={(e) => {
                        const raw = e.target.value;
                        onChangeRating(book, raw === '' ? null : Number(raw));
                      }}
                    >
                      <option value="">None</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    disabled={isRowBusy}
                    onClick={() => onStartEdit(book)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={isRowBusy}
                    onClick={() => onDeleteBook(book.id)}
                  >
                    {isRowBusy ? 'Working...' : 'Delete'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

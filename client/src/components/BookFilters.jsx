const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];

export default function BookFilters({
  searchQuery,
  genreFilter,
  readFilter,
  sortField,
  sortOrder,
  onSearchChange,
  onGenreChange,
  onReadChange,
  onSortFieldChange,
  onSortOrderChange,
  onResetFilters,
}) {
  return (
    <section aria-label="Search, filter, and sort">
      <h2>Search &amp; Filters</h2>
      <div>
        <label htmlFor="search-input">Search (title or author): </label>
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Type title or author..."
        />

        <label htmlFor="genre-filter"> Genre: </label>
        <select
          id="genre-filter"
          value={genreFilter}
          onChange={(e) => onGenreChange(e.target.value)}
        >
          <option value="">All genres</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <label htmlFor="read-filter"> Read status: </label>
        <select
          id="read-filter"
          value={readFilter}
          onChange={(e) => onReadChange(e.target.value)}
        >
          <option value="">All</option>
          <option value="true">Read</option>
          <option value="false">Unread</option>
        </select>

        <label htmlFor="sort-field"> Sort by: </label>
        <select
          id="sort-field"
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value)}
        >
          <option value="id">Default (id)</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
        </select>

        <label htmlFor="sort-order"> Order: </label>
        <select
          id="sort-order"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
        >
          <option value="asc">Ascending (asc)</option>
          <option value="desc">Descending (desc)</option>
        </select>

        <button type="button" onClick={onResetFilters}>
          Reset
        </button>
      </div>
    </section>
  );
}

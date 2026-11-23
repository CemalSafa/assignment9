export default function StatsPanel({ stats, loading }) {
  if (!stats) {
    return (
      <section aria-label="Statistics">
        <h2>Statistics</h2>
        <p>{loading ? 'Loading statistics...' : 'No statistics available.'}</p>
      </section>
    );
  }

  const genreEntries = Object.entries(stats.byGenre || {});

  return (
    <section aria-label="Statistics">
      <h2>Statistics</h2>
      <p>
        Total: <strong>{stats.total}</strong> | Read: <strong>{stats.read}</strong> | Unread:{' '}
        <strong>{stats.unread}</strong> | Average Rating:{' '}
        <strong>{stats.averageRating === null ? 'N/A' : stats.averageRating}</strong>
      </p>
      <div>
        <strong>By Genre:</strong>{' '}
        {genreEntries.length === 0 ? (
          <span>None</span>
        ) : (
          genreEntries.map(([genre, count], idx) => (
            <span key={genre}>
              {genre}: {count}
              {idx < genreEntries.length - 1 ? ', ' : ''}
            </span>
          ))
        )}
      </div>
    </section>
  );
}

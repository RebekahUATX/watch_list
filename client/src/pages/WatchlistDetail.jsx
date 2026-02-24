import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWatchlist, getImageConfig, removeFromWatchlist, setWatchlistItemWatched } from '../api';

export function WatchlistDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getImageConfig().then(setConfig).catch(() => setConfig({ images: { secure_base_url: '', poster_sizes: ['w342'] } }));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getWatchlist(id)
      .then(setList)
      .catch(() => setList(null))
      .finally(() => setLoading(false));
  }, [id]);

  const imgBase = config?.images?.secure_base_url || '';

  const remove = async (type, tmdbId) => {
    try {
      await removeFromWatchlist(id, type, tmdbId);
      setList(await getWatchlist(id));
    } catch (_) {}
  };

  const toggleWatched = async (type, tmdbId, current) => {
    try {
      await setWatchlistItemWatched(id, type, tmdbId, !current);
      setList(await getWatchlist(id));
    } catch (_) {}
  };

  if (loading) return <p className="loading">Loading…</p>;
  if (!list) return <p className="error">Watchlist not found.</p>;

  const items = list.items || [];

  return (
    <div className="watchlist-detail">
      <nav className="breadcrumb">
        <Link to="/watchlists">My Watchlists</Link>
        <span>/</span>
        <span>{list.name}</span>
      </nav>
      <h1>{list.name}</h1>
      {list.shareCode && (
        <p className="share-info">
          Share code: <strong>{list.shareCode}</strong> — others can open this list at <strong>Open shared list</strong> and enter the code.
        </p>
      )}
      {items.length === 0 && <p className="empty">No items yet. Add from Search.</p>}
      <div className="results-grid">
        {items.map((item) => (
          <div key={`${item.type}-${item.tmdbId}`} className="result-card">
            <Link to={`/detail/${item.type}/${item.tmdbId}`} className="poster-wrap">
              {item.posterPath ? (
                <img src={`${imgBase}w342${item.posterPath}`} alt="" />
              ) : (
                <div className="no-poster">{item.title}</div>
              )}
            </Link>
            <div className="card-info">
              <Link to={`/detail/${item.type}/${item.tmdbId}`} className="card-title">{item.title}</Link>
              <p className="card-meta">
                {item.releaseDate?.slice(0, 4)} · ★ {item.voteAverage != null ? item.voteAverage.toFixed(1) : '—'}
              </p>
              <button
                type="button"
                className={`btn-watched ${item.watched ? 'watched' : ''}`}
                onClick={() => toggleWatched(item.type, item.tmdbId, item.watched)}
                title={item.watched ? 'Mark as unwatched' : 'Mark as watched'}
              >
                {item.watched ? '✓ Watched' : 'Mark as watched'}
              </button>
              <button type="button" className="btn-remove" onClick={() => remove(item.type, item.tmdbId)}>
                Remove from list
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

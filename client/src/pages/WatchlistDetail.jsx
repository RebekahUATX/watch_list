import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWatchlist, getImageConfig, removeFromWatchlist, setWatchlistItemWatched, searchMovies, searchTv, addToWatchlist } from '../api';

export function WatchlistDetail() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('movie');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

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

  useEffect(() => {
    if (!addModalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setAddModalOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [addModalOpen]);

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

  const runSearch = async (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchResults(null);
    try {
      const fn = searchType === 'movie' ? searchMovies : searchTv;
      const data = await fn(q, 1);
      setSearchResults(data);
    } catch (_) {
      setSearchResults({ results: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  const addFromSearch = async (item) => {
    setAddingId(item.id);
    try {
      await addToWatchlist(id, {
        tmdbId: item.id,
        type: searchType,
        title: item.title || item.name,
        posterPath: item.poster_path,
        releaseDate: item.release_date || item.first_air_date,
        voteAverage: item.vote_average,
      });
      setList(await getWatchlist(id));
    } catch (_) {}
    setAddingId(null);
  };

  const alreadyInList = (item) => (list?.items || []).some((i) => i.type === searchType && i.tmdbId === item.id);

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
      <button type="button" className="btn-add-to-watchlist" onClick={() => setAddModalOpen(true)}>
        Add to watchlist
      </button>
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

      {addModalOpen && (
        <div className="add-modal-overlay" onClick={() => setAddModalOpen(false)} role="button" tabIndex={0} aria-label="Close">
          <div className="add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <h3>Add to {list.name}</h3>
              <button type="button" className="add-modal-close" onClick={() => setAddModalOpen(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={runSearch} className="add-modal-search">
              <div className="add-modal-type">
                <button type="button" className={searchType === 'movie' ? 'active' : ''} onClick={() => setSearchType('movie')}>Movies</button>
                <button type="button" className={searchType === 'tv' ? 'active' : ''} onClick={() => setSearchType('tv')}>TV Shows</button>
              </div>
              <div className="add-modal-row">
                <input
                  type="text"
                  placeholder={`Search ${searchType === 'movie' ? 'movies' : 'TV shows'}…`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="add-modal-input"
                  autoFocus
                />
                <button type="submit" className="btn-primary" disabled={searchLoading || !searchQuery.trim()}>
                  {searchLoading ? 'Searching…' : 'Search'}
                </button>
              </div>
            </form>
            {searchResults && (
              <div className="add-modal-results">
                {searchLoading ? (
                  <p className="loading">Searching…</p>
                ) : (searchResults.results || []).length === 0 ? (
                  <p className="empty">No results. Try a different search.</p>
                ) : (
                  <div className="results-grid add-modal-grid">
                    {(searchResults.results || []).map((item) => (
                      <div key={item.id} className="result-card">
                        <Link to={`/detail/${searchType}/${item.id}`} className="poster-wrap" onClick={() => setAddModalOpen(false)}>
                          {item.poster_path ? (
                            <img src={`${imgBase}w342${item.poster_path}`} alt="" />
                          ) : (
                            <div className="no-poster">{item.title || item.name}</div>
                          )}
                        </Link>
                        <div className="card-info">
                          <Link to={`/detail/${searchType}/${item.id}`} className="card-title" onClick={() => setAddModalOpen(false)}>
                            {item.title || item.name}
                          </Link>
                          <p className="card-meta">
                            {(item.release_date || item.first_air_date)?.slice(0, 4)} · ★ {item.vote_average?.toFixed(1) || '—'}
                          </p>
                          {alreadyInList(item) ? (
                            <span className="already-in-list">In list</span>
                          ) : (
                            <button
                              type="button"
                              className="btn-add-item"
                              onClick={() => addFromSearch(item)}
                              disabled={!!addingId}
                            >
                              {addingId === item.id ? 'Adding…' : 'Add'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

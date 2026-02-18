import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getWatchlistByShareCode, getImageConfig } from '../api';

export function SharedView() {
  const { shareCode } = useParams();
  const location = useLocation();
  const [list, setList] = useState(location.state?.list || null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(!list);

  useEffect(() => {
    getImageConfig().then(setConfig).catch(() => setConfig({ images: { secure_base_url: '' } }));
  }, []);

  useEffect(() => {
    if (!shareCode) return;
    if (location.state?.list) {
      setList(location.state.list);
      setLoading(false);
      return;
    }
    setLoading(true);
    getWatchlistByShareCode(shareCode)
      .then(setList)
      .catch(() => setList(null))
      .finally(() => setLoading(false));
  }, [shareCode, location.state]);

  const imgBase = config?.images?.secure_base_url || '';
  const items = list?.items || [];

  if (loading) return <p className="loading">Loading…</p>;
  if (!list) return <p className="error">Shared list not found.</p>;

  return (
    <div className="watchlist-detail shared-view">
      <nav className="breadcrumb">
        <Link to="/shared">Open shared list</Link>
        <span>/</span>
        <span>{list.name}</span>
      </nav>
      <h1>{list.name} <span className="badge">Shared</span></h1>
      <p className="subtitle">View-only. Create your own list to save items.</p>
      {items.length === 0 && <p className="empty">This list is empty.</p>}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getImageConfig, getMyWatchlists, addToWatchlist } from '../api';

export function Detail() {
  const { type, id } = useParams();
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlists, setWatchlists] = useState([]);
  const [addingToList, setAddingToList] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    getImageConfig().then(setConfig).catch(() => setConfig({ images: { secure_base_url: '' } }));
    getMyWatchlists().then(setWatchlists).catch(() => setWatchlists([]));
  }, []);

  useEffect(() => {
    if (!trailerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setTrailerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [trailerOpen]);

  useEffect(() => {
    if (!type || !id) return;
    setLoading(true);
    fetch(`/api/search/detail/${type}/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success === false) setItem(null);
        else setItem(data);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [type, id]);

  if (loading) return <p className="loading">Loading…</p>;
  if (!item) return <p className="error">Not found.</p>;

  const imgBase = config?.images?.secure_base_url || '';
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;
  const poster = item.poster_path ? `${imgBase}w500${item.poster_path}` : null;
  const vote = item.vote_average;
  const stars5 = vote != null ? (vote / 2).toFixed(1) : null;
  const filledStars = vote != null ? Math.round((vote / 10) * 5) : 0;

  const addToList = async (listId) => {
    setAddingToList(listId);
    try {
      await addToWatchlist(listId, {
        tmdbId: item.id,
        type: item.title ? 'movie' : 'tv',
        title: item.title || item.name,
        posterPath: item.poster_path,
        releaseDate: item.release_date || item.first_air_date,
        voteAverage: item.vote_average,
      });
      setWatchlists(await getMyWatchlists());
    } catch (_) {}
    setAddingToList(null);
  };

  return (
    <div className="detail-page">
      <Link to="/" state={{ searchState: location.state?.searchState }} className="back">← Back to search</Link>
      <div className="detail-hero">
        <div className="detail-poster-wrap">
          {poster && <img src={poster} alt="" className="detail-poster" />}
        </div>
        <div className="detail-meta">
          <h1>{title}</h1>
          <p className="detail-date">
            {date?.slice(0, 4)}
            {item.certification && <span> · {item.certification}</span>}
            {vote != null && (
              <span> · <span className="detail-rating" title={`${vote.toFixed(1)}/10 on TMDB`}>
                {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)} {stars5}/5
              </span></span>
            )}
          </p>
          {item.overview && <p className="detail-overview">{item.overview}</p>}
          {item.genres?.length > 0 && (
            <p className="detail-genres">{item.genres.map((g) => g.name).join(', ')}</p>
          )}
          <div className="detail-crew">
            {item.director && (
              <p className="detail-director"><strong>Director:</strong> {item.director}</p>
            )}
            {item.cast?.length > 0 && (
              <p className="detail-cast">
                <strong>Cast:</strong> {item.cast.slice(0, 3).map((c) => c.name).join(', ')}
              </p>
            )}
          </div>
          {item.trailerKey && (
            <button
              type="button"
              className="detail-trailer-btn"
              onClick={() => setTrailerOpen(true)}
            >
              ▶ Watch trailer
            </button>
          )}
          {watchlists.length > 0 && (
            <div className="detail-add-to-list">
              <select
                onChange={(e) => {
                  const listId = e.target.value;
                  if (listId) addToList(listId);
                  e.target.value = '';
                }}
                disabled={!!addingToList}
              >
                <option value="">Add to watchlist…</option>
                {watchlists.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          {watchlists.length === 0 && (
            <Link to="/watchlists" className="detail-create-list">Create a watchlist to save</Link>
          )}
        </div>
      </div>
      {item.trailerKey && trailerOpen && (
        <div className="detail-trailer-overlay" onClick={() => setTrailerOpen(false)} role="button" tabIndex={0} aria-label="Close trailer">
          <div className="detail-trailer-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="detail-trailer-close" onClick={() => setTrailerOpen(false)} aria-label="Close">×</button>
            <div className="detail-trailer-wrap">
              <iframe
                style={{ border: 0, display: 'block' }}
                title={`${title} trailer`}
                src={`https://www.youtube.com/embed/${item.trailerKey}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

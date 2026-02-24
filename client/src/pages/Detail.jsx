import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getImageConfig } from '../api';

export function Detail() {
  const { type, id } = useParams();
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getImageConfig().then(setConfig).catch(() => setConfig({ images: { secure_base_url: '' } }));
  }, []);

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

  return (
    <div className="detail-page">
      <Link to="/" state={{ searchState: location.state?.searchState }} className="back">← Back to search</Link>
      <div className="detail-hero">
        {poster && <img src={poster} alt="" className="detail-poster" />}
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
          {item.director && (
            <p className="detail-director"><strong>Director:</strong> {item.director}</p>
          )}
          {item.cast?.length > 0 && (
            <div className="detail-cast">
              <strong>Cast</strong>
              <ul>
                {item.cast.map((c, i) => (
                  <li key={i}>{c.name}{c.character ? ` (${c.character})` : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

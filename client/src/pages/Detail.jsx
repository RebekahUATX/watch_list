import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getImageConfig } from '../api';

export function Detail() {
  const { type, id } = useParams();
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

  return (
    <div className="detail-page">
      <Link to="/" className="back">← Back to search</Link>
      <div className="detail-hero">
        {poster && <img src={poster} alt="" className="detail-poster" />}
        <div className="detail-meta">
          <h1>{title}</h1>
          <p className="detail-date">{date?.slice(0, 4)} · ★ {item.vote_average?.toFixed(1) ?? '—'}</p>
          {item.overview && <p className="detail-overview">{item.overview}</p>}
          {item.genres?.length > 0 && (
            <p className="detail-genres">{item.genres.map((g) => g.name).join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWatchlistByShareCode } from '../api';

export function Shared() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setError('');
    getWatchlistByShareCode(trimmed)
      .then((list) => {
        navigate(`/shared/${trimmed}`, { state: { list } });
      })
      .catch(() => setError('No list found with that code. Check the code and try again.'));
  };

  return (
    <div className="shared-page">
      <h1>Open a shared watchlist</h1>
      <p className="subtitle">Enter the share code someone gave you to view their list.</p>
      <form onSubmit={handleSubmit} className="shared-form">
        <input
          type="text"
          placeholder="Share code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="share-code-input"
        />
        <button type="submit">Open list</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

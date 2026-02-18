import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWatchlists, createWatchlist, deleteWatchlist } from '../api';

export function Watchlists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [shared, setShared] = useState(false);

  const load = () => {
    setLoading(true);
    getMyWatchlists()
      .then(setLists)
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createWatchlist(newName.trim(), shared);
      setNewName('');
      setShared(false);
      load();
    } catch (_) {}
    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this watchlist?')) return;
    try {
      await deleteWatchlist(id);
      load();
    } catch (_) {}
  };

  return (
    <div className="watchlists-page">
      <h1>My Watchlists</h1>
      <p className="subtitle">Create lists to save films and shows. Share a list with others using its code.</p>

      <form onSubmit={handleCreate} className="create-form">
        <input
          type="text"
          placeholder="New list name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <label className="checkbox-label">
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
          Shared (get a link others can open)
        </label>
        <button type="submit" disabled={creating || !newName.trim()}>
          {creating ? 'Creating…' : 'Create list'}
        </button>
      </form>

      {loading && <p>Loading…</p>}
      {!loading && lists.length === 0 && (
        <p className="empty">No watchlists yet. Create one above or add items from Search.</p>
      )}
      {!loading && lists.length > 0 && (
        <ul className="watchlist-list">
          {lists.map((list) => (
            <li key={list.id} className="watchlist-item">
              <Link to={`/watchlists/${list.id}`} className="list-name">
                {list.name}
              </Link>
              <span className="list-meta">
                {list.items?.length || 0} items
                {list.shareCode && (
                  <span className="share-code" title="Share this code for others to open the list">
                    Code: <strong>{list.shareCode}</strong>
                  </span>
                )}
              </span>
              <button type="button" className="btn-delete" onClick={() => handleDelete(list.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

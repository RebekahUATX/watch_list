const API = '/api';

function getOwnerId() {
  let id = localStorage.getItem('watchlist_owner_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 12);
    localStorage.setItem('watchlist_owner_id', id);
  }
  return id;
}

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Owner-Id': getOwnerId(),
});

async function handleApiError(res) {
  if (res.ok) return null;
  let msg = 'Search failed';
  try {
    const data = await res.json();
    if (data?.error?.includes('TMDB 401')) msg = 'Invalid API key. Check your TMDB key in .env and restart the server.';
    else if (data?.error) msg = data.error;
  } catch (_) {}
  throw new Error(msg);
}

export async function getImageConfig() {
  const res = await fetch(`${API}/search/config`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function getMovieGenres() {
  const res = await fetch(`${API}/genres/movies`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function getTvGenres() {
  const res = await fetch(`${API}/genres/tv`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function discoverMovies(params) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/search/movies?${q}`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function discoverTv(params) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/search/tv?${q}`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function searchMovies(query, page = 1) {
  const res = await fetch(`${API}/search/movies/query?q=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function searchTv(query, page = 1) {
  const res = await fetch(`${API}/search/tv/query?q=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function searchKeywords(query) {
  const res = await fetch(`${API}/search/keywords?q=${encodeURIComponent(query)}`);
  if (!res.ok) return { results: [] };
  const data = await res.json();
  return data;
}

export async function searchPeople(query) {
  const res = await fetch(`${API}/search/people?q=${encodeURIComponent(query)}`);
  if (!res.ok) return { results: [] };
  const data = await res.json();
  return data;
}

export async function getMyWatchlists() {
  const res = await fetch(`${API}/watchlists/mine`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to load watchlists');
  return res.json();
}

export async function getWatchlist(id) {
  const res = await fetch(`${API}/watchlists/${id}`);
  if (!res.ok) throw new Error('Failed to load watchlist');
  return res.json();
}

export async function getWatchlistByShareCode(shareCode) {
  const res = await fetch(`${API}/watchlists/shared/${encodeURIComponent(shareCode)}`);
  if (!res.ok) throw new Error('Watchlist not found');
  return res.json();
}

export async function createWatchlist(name, isShared = false) {
  const res = await fetch(`${API}/watchlists`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, isShared }),
  });
  if (!res.ok) throw new Error('Failed to create watchlist');
  return res.json();
}

export async function updateWatchlist(id, updates) {
  const res = await fetch(`${API}/watchlists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers() },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

export async function deleteWatchlist(id) {
  const res = await fetch(`${API}/watchlists/${id}`, { method: 'DELETE', headers: headers() });
  if (!res.ok) throw new Error('Failed to delete');
}

export async function addToWatchlist(listId, item) {
  const res = await fetch(`${API}/watchlists/${listId}/items`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add');
  return res.json();
}

export async function removeFromWatchlist(listId, type, tmdbId) {
  const res = await fetch(`${API}/watchlists/${listId}/items/${type}/${tmdbId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to remove');
  return res.json();
}

export async function setWatchlistItemWatched(listId, type, tmdbId, watched) {
  const res = await fetch(`${API}/watchlists/${listId}/items/${type}/${tmdbId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers() },
    body: JSON.stringify({ watched }),
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

export { getOwnerId };

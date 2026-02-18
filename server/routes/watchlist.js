import { Router } from 'express';
import * as store from '../store.js';

export const watchlistRouter = Router();

// Get or create current user id (sent in header or body for simplicity)
function getOwnerId(req) {
  return req.headers['x-owner-id'] || req.body?.ownerId || null;
}

// Get my watchlists (by owner id)
watchlistRouter.get('/mine', (req, res) => {
  const ownerId = getOwnerId(req);
  const lists = store.getWatchlistsByOwner(ownerId);
  res.json(lists);
});

// Get single watchlist by id
watchlistRouter.get('/:id', (req, res) => {
  const list = store.getWatchlistById(req.params.id);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

// Get watchlist by share code (for shared links)
watchlistRouter.get('/shared/:shareCode', (req, res) => {
  const list = store.getWatchlistByShareCode(req.params.shareCode);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

// Create watchlist
watchlistRouter.post('/', (req, res) => {
  const ownerId = getOwnerId(req);
  const { name, isShared } = req.body || {};
  const list = store.createWatchlist({ name, ownerId, isShared: !!isShared });
  res.status(201).json(list);
});

// Update watchlist (name, isShared)
watchlistRouter.patch('/:id', (req, res) => {
  const list = store.updateWatchlist(req.params.id, req.body);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

// Delete watchlist
watchlistRouter.delete('/:id', (req, res) => {
  const ok = store.deleteWatchlist(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Watchlist not found' });
  res.status(204).send();
});

// Add item to watchlist
watchlistRouter.post('/:id/items', (req, res) => {
  const list = store.addItemToList(req.params.id, req.body);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.status(201).json(list);
});

// Remove item from watchlist
watchlistRouter.delete('/:id/items/:type/:tmdbId', (req, res) => {
  const list = store.removeItemFromList(
    req.params.id,
    req.params.type,
    req.params.tmdbId
  );
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

import { Router } from 'express';
import * as store from '../store.js';

export const watchlistRouter = Router();

// Get or create current user id (sent in header or body for simplicity)
function getOwnerId(req) {
  return req.headers['x-owner-id'] || req.body?.ownerId || null;
}

// Get my watchlists (by owner id)
watchlistRouter.get('/mine', async (req, res) => {
  const ownerId = getOwnerId(req);
  const lists = await store.getWatchlistsByOwner(ownerId);
  res.json(lists);
});

// Get watchlist by share code (for shared links) - must be before /:id
watchlistRouter.get('/shared/:shareCode', async (req, res) => {
  const list = await store.getWatchlistByShareCode(req.params.shareCode);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

// Get single watchlist by id
watchlistRouter.get('/:id', async (req, res) => {
  const list = await store.getWatchlistById(req.params.id);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

// Create watchlist
watchlistRouter.post('/', async (req, res) => {
  const ownerId = getOwnerId(req);
  const { name, isShared } = req.body || {};
  const list = await store.createWatchlist({ name, ownerId, isShared: !!isShared });
  res.status(201).json(list);
});

// Update watchlist (name, isShared)
watchlistRouter.patch('/:id', async (req, res) => {
  const list = await store.updateWatchlist(req.params.id, req.body);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

// Delete watchlist
watchlistRouter.delete('/:id', async (req, res) => {
  const ok = await store.deleteWatchlist(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Watchlist not found' });
  res.status(204).send();
});

// Add item to watchlist
watchlistRouter.post('/:id/items', async (req, res) => {
  const list = await store.addItemToList(req.params.id, req.body);
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.status(201).json(list);
});

// Update item (e.g. mark as watched)
watchlistRouter.patch('/:id/items/:type/:tmdbId', async (req, res) => {
  const { watched } = req.body || {};
  if (typeof watched !== 'boolean') return res.status(400).json({ error: 'watched (boolean) required' });
  const list = await store.setItemWatched(
    req.params.id,
    req.params.type,
    req.params.tmdbId,
    watched
  );
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

// Remove item from watchlist
watchlistRouter.delete('/:id/items/:type/:tmdbId', async (req, res) => {
  const list = await store.removeItemFromList(
    req.params.id,
    req.params.type,
    req.params.tmdbId
  );
  if (!list) return res.status(404).json({ error: 'Watchlist not found' });
  res.json(list);
});

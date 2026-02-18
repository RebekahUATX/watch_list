import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data', 'watchlists.json');

function load() {
  try {
    if (existsSync(DB_PATH)) {
      return JSON.parse(readFileSync(DB_PATH, 'utf8'));
    }
  } catch (_) {}
  return { watchlists: [], nextId: 1 };
}

function save(data) {
  const dataDir = join(__dirname, 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getAllWatchlists() {
  return load().watchlists;
}

export function getWatchlistById(id) {
  const list = load().watchlists.find((w) => w.id === id);
  return list || null;
}

export function getWatchlistByShareCode(shareCode) {
  const list = load().watchlists.find(
    (w) => w.shareCode && w.shareCode.toLowerCase() === String(shareCode).toLowerCase()
  );
  return list || null;
}

export function getWatchlistsByOwner(ownerId) {
  return load().watchlists.filter((w) => w.ownerId === ownerId);
}

export function createWatchlist({ name, ownerId, isShared = false }) {
  const data = load();
  const shareCode = isShared ? nanoid(8) : null;
  const watchlist = {
    id: nanoid(),
    name: name || 'My Watchlist',
    ownerId: ownerId || null,
    shareCode,
    isShared: !!isShared,
    items: [],
    createdAt: new Date().toISOString(),
  };
  data.watchlists.push(watchlist);
  save(data);
  return watchlist;
}

export function updateWatchlist(id, updates) {
  const data = load();
  const idx = data.watchlists.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const watchlist = { ...data.watchlists[idx], ...updates };
  data.watchlists[idx] = watchlist;
  save(data);
  return watchlist;
}

export function deleteWatchlist(id) {
  const data = load();
  const idx = data.watchlists.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  data.watchlists.splice(idx, 1);
  save(data);
  return true;
}

export function addItemToList(listId, item) {
  const data = load();
  const w = data.watchlists.find((x) => x.id === listId);
  if (!w) return null;
  const key = `${item.type}-${item.tmdbId}`;
  if (w.items.some((i) => `${i.type}-${i.tmdbId}` === key)) return w;
  w.items.push({
    tmdbId: item.tmdbId,
    type: item.type,
    title: item.title,
    posterPath: item.posterPath || null,
    releaseDate: item.releaseDate || null,
    voteAverage: item.voteAverage != null ? item.voteAverage : null,
    addedAt: new Date().toISOString(),
  });
  save(data);
  return w;
}

export function removeItemFromList(listId, type, tmdbId) {
  const data = load();
  const w = data.watchlists.find((x) => x.id === listId);
  if (!w) return null;
  w.items = w.items.filter((i) => !(i.type === type && i.tmdbId === Number(tmdbId)));
  save(data);
  return w;
}

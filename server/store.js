import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { pgStore } from './store-postgres.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data', 'watchlists.json');
const usePg = !!process.env.DATABASE_URL;

function fileLoad() {
  try {
    if (existsSync(DB_PATH)) {
      return JSON.parse(readFileSync(DB_PATH, 'utf8'));
    }
  } catch (_) {}
  return { watchlists: [], nextId: 1 };
}

function fileSave(data) {
  const dataDir = join(__dirname, 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function getAllWatchlists() {
  if (usePg) return (await pgStore.load()).watchlists;
  return fileLoad().watchlists;
}

export async function getWatchlistById(id) {
  if (usePg) return pgStore.getWatchlistById(id);
  const list = fileLoad().watchlists.find((w) => w.id === id);
  return list || null;
}

export async function getWatchlistByShareCode(shareCode) {
  if (usePg) return pgStore.getWatchlistByShareCode(shareCode);
  const list = fileLoad().watchlists.find(
    (w) => w.shareCode && w.shareCode.toLowerCase() === String(shareCode).toLowerCase()
  );
  return list || null;
}

export async function getWatchlistsByOwner(ownerId) {
  if (usePg) return pgStore.getWatchlistsByOwner(ownerId);
  return fileLoad().watchlists.filter((w) => w.ownerId === ownerId);
}

export async function createWatchlist({ name, ownerId, isShared = false }) {
  if (usePg) return pgStore.createWatchlist({ name, ownerId, isShared });
  const data = fileLoad();
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
  fileSave(data);
  return watchlist;
}

export async function updateWatchlist(id, updates) {
  if (usePg) return pgStore.updateWatchlist(id, updates);
  const data = fileLoad();
  const idx = data.watchlists.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const watchlist = { ...data.watchlists[idx], ...updates };
  data.watchlists[idx] = watchlist;
  fileSave(data);
  return watchlist;
}

export async function deleteWatchlist(id) {
  if (usePg) return pgStore.deleteWatchlist(id);
  const data = fileLoad();
  const idx = data.watchlists.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  data.watchlists.splice(idx, 1);
  fileSave(data);
  return true;
}

export async function addItemToList(listId, item) {
  if (usePg) return pgStore.addItemToList(listId, item);
  const data = fileLoad();
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
    watched: false,
  });
  fileSave(data);
  return w;
}

export async function removeItemFromList(listId, type, tmdbId) {
  if (usePg) return pgStore.removeItemFromList(listId, type, tmdbId);
  const data = fileLoad();
  const w = data.watchlists.find((x) => x.id === listId);
  if (!w) return null;
  w.items = w.items.filter((i) => !(i.type === type && i.tmdbId === Number(tmdbId)));
  fileSave(data);
  return w;
}

export async function setItemWatched(listId, type, tmdbId, watched) {
  if (usePg) return pgStore.setItemWatched(listId, type, tmdbId, watched);
  const data = fileLoad();
  const w = data.watchlists.find((x) => x.id === listId);
  if (!w) return null;
  const item = w.items.find((i) => i.type === type && i.tmdbId === Number(tmdbId));
  if (!item) return null;
  item.watched = !!watched;
  fileSave(data);
  return w;
}

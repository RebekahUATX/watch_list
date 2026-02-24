import pg from 'pg';
const { Pool } = pg;

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

async function init() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "ownerId" TEXT,
      "shareCode" TEXT,
      "isShared" BOOLEAN DEFAULT false,
      items JSONB DEFAULT '[]',
      "createdAt" TIMESTAMPTZ
    )
  `);
}

async function load() {
  const p = getPool();
  const res = await p.query('SELECT * FROM watchlists ORDER BY "createdAt" ASC');
  const watchlists = res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    ownerId: r.ownerId,
    shareCode: r.shareCode,
    isShared: r.isShared ?? false,
    items: r.items || [],
    createdAt: r.createdAt,
  }));
  return { watchlists };
}

async function getWatchlistById(id) {
  const p = getPool();
  const res = await p.query('SELECT * FROM watchlists WHERE id = $1', [id]);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    ownerId: r.ownerId,
    shareCode: r.shareCode,
    isShared: r.isShared ?? false,
    items: r.items || [],
    createdAt: r.createdAt,
  };
}

async function getWatchlistByShareCode(shareCode) {
  const p = getPool();
  const res = await p.query(
    'SELECT * FROM watchlists WHERE LOWER("shareCode") = LOWER($1)',
    [String(shareCode)]
  );
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    ownerId: r.ownerId,
    shareCode: r.shareCode,
    isShared: r.isShared ?? false,
    items: r.items || [],
    createdAt: r.createdAt,
  };
}

async function getWatchlistsByOwner(ownerId) {
  const p = getPool();
  const res = await p.query('SELECT * FROM watchlists WHERE "ownerId" = $1 ORDER BY "createdAt" ASC', [
    ownerId,
  ]);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    ownerId: r.ownerId,
    shareCode: r.shareCode,
    isShared: r.isShared ?? false,
    items: r.items || [],
    createdAt: r.createdAt,
  }));
}

async function createWatchlist({ name, ownerId, isShared = false }) {
  const { nanoid } = await import('nanoid');
  const id = nanoid();
  const shareCode = isShared ? nanoid(8) : null;
  const createdAt = new Date().toISOString();
  const p = getPool();
  await p.query(
    `INSERT INTO watchlists (id, name, "ownerId", "shareCode", "isShared", items, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name || 'My Watchlist', ownerId || null, shareCode, !!isShared, JSON.stringify([]), createdAt]
  );
  return { id, name: name || 'My Watchlist', ownerId: ownerId || null, shareCode, isShared: !!isShared, items: [], createdAt };
}

async function updateWatchlist(id, updates) {
  const w = await getWatchlistById(id);
  if (!w) return null;
  const { name, shareCode, isShared } = { ...w, ...updates };
  const p = getPool();
  await p.query(
    `UPDATE watchlists SET name = $2, "shareCode" = $3, "isShared" = $4 WHERE id = $1`,
    [id, name, shareCode, !!isShared]
  );
  return { ...w, name, shareCode, isShared };
}

async function deleteWatchlist(id) {
  const p = getPool();
  const res = await p.query('DELETE FROM watchlists WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}

async function addItemToList(listId, item) {
  const w = await getWatchlistById(listId);
  if (!w) return null;
  const key = `${item.type}-${item.tmdbId}`;
  if (w.items.some((i) => `${i.type}-${i.tmdbId}` === key)) return w;
  const newItem = {
    tmdbId: item.tmdbId,
    type: item.type,
    title: item.title,
    posterPath: item.posterPath || null,
    releaseDate: item.releaseDate || null,
    voteAverage: item.voteAverage != null ? item.voteAverage : null,
    addedAt: new Date().toISOString(),
    watched: false,
  };
  const items = [...w.items, newItem];
  const p = getPool();
  await p.query('UPDATE watchlists SET items = $2 WHERE id = $1', [listId, JSON.stringify(items)]);
  return { ...w, items };
}

async function removeItemFromList(listId, type, tmdbId) {
  const w = await getWatchlistById(listId);
  if (!w) return null;
  const items = w.items.filter((i) => !(i.type === type && i.tmdbId === Number(tmdbId)));
  const p = getPool();
  await p.query('UPDATE watchlists SET items = $2 WHERE id = $1', [listId, JSON.stringify(items)]);
  return { ...w, items };
}

async function setItemWatched(listId, type, tmdbId, watched) {
  const w = await getWatchlistById(listId);
  if (!w) return null;
  const item = w.items.find((i) => i.type === type && i.tmdbId === Number(tmdbId));
  if (!item) return null;
  item.watched = !!watched;
  const p = getPool();
  await p.query('UPDATE watchlists SET items = $2 WHERE id = $1', [listId, JSON.stringify(w.items)]);
  return w;
}

export const pgStore = {
  init,
  load,
  getWatchlistById,
  getWatchlistByShareCode,
  getWatchlistsByOwner,
  createWatchlist,
  updateWatchlist,
  deleteWatchlist,
  addItemToList,
  removeItemFromList,
  setItemWatched,
};

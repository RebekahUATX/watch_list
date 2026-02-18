import { Router } from 'express';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

async function tmdb(path, query = {}) {
  const params = new URLSearchParams({ api_key: API_KEY || '', ...query });
  const url = `${TMDB_BASE}${path}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export const genresRouter = Router();

genresRouter.get('/movies', async (req, res) => {
  try {
    const data = await tmdb('/genre/movie/list', { language: 'en-US' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

genresRouter.get('/tv', async (req, res) => {
  try {
    const data = await tmdb('/genre/tv/list', { language: 'en-US' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

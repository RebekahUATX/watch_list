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

export const searchRouter = Router();

// Discover movies with filters
searchRouter.get('/movies', async (req, res) => {
  try {
    const {
      page = 1,
      sort_by = 'popularity.desc',
      with_genres,
      primary_release_year,
      'primary_release_date.gte': gte,
      'primary_release_date.lte': lte,
      'vote_average.gte': voteGte,
      'vote_count.gte': voteCountGte,
      with_original_language,
      with_keywords,
      with_cast,
      with_crew,
      'with_runtime.gte': runtimeGte,
      'with_runtime.lte': runtimeLte,
      certification,
      certification_country = 'US',
    } = req.query;
    const query = {
      page,
      sort_by,
      language: 'en-US',
    };
    if (with_genres) query.with_genres = with_genres;
    if (primary_release_year) query.primary_release_year = primary_release_year;
    if (gte) query['primary_release_date.gte'] = gte;
    if (lte) query['primary_release_date.lte'] = lte;
    if (voteGte) query['vote_average.gte'] = voteGte;
    if (voteCountGte) query['vote_count.gte'] = voteCountGte;
    if (with_original_language) query.with_original_language = with_original_language;
    if (with_keywords) query.with_keywords = with_keywords;
    if (with_cast) query.with_cast = with_cast;
    if (with_crew) query.with_crew = with_crew;
    if (runtimeGte) query['with_runtime.gte'] = runtimeGte;
    if (runtimeLte) query['with_runtime.lte'] = runtimeLte;
    if (certification) {
      query.certification_country = certification_country;
      query.certification = certification;
    }

    const data = await tmdb('/discover/movie', query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Discover TV with filters
searchRouter.get('/tv', async (req, res) => {
  try {
    const {
      page = 1,
      sort_by = 'popularity.desc',
      with_genres,
      first_air_date_year,
      'first_air_date.gte': gte,
      'first_air_date.lte': lte,
      'vote_average.gte': voteGte,
      'vote_count.gte': voteCountGte,
      with_original_language,
      with_status,
      with_cast,
      with_crew,
      'with_runtime.gte': runtimeGte,
      'with_runtime.lte': runtimeLte,
      certification,
      certification_country = 'US',
    } = req.query;
    const query = {
      page,
      sort_by,
      language: 'en-US',
    };
    if (with_genres) query.with_genres = with_genres;
    if (first_air_date_year) query.first_air_date_year = first_air_date_year;
    if (gte) query['first_air_date.gte'] = gte;
    if (lte) query['first_air_date.lte'] = lte;
    if (voteGte) query['vote_average.gte'] = voteGte;
    if (voteCountGte) query['vote_count.gte'] = voteCountGte;
    if (with_original_language) query.with_original_language = with_original_language;
    if (with_status) query.with_status = with_status;
    if (with_cast) query.with_cast = with_cast;
    if (with_crew) query.with_crew = with_crew;
    if (runtimeGte) query['with_runtime.gte'] = runtimeGte;
    if (runtimeLte) query['with_runtime.lte'] = runtimeLte;
    if (certification) {
      query.certification_country = certification_country;
      query.certification = certification;
    }

    const data = await tmdb('/discover/tv', query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Search people (for cast/crew filters)
searchRouter.get('/people', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });
    const data = await tmdb('/search/person', { query: q.trim(), page });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Search keywords (for description-based search)
searchRouter.get('/keywords', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });
    const data = await tmdb('/search/keyword', { query: q.trim(), page });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Text search movies
searchRouter.get('/movies/query', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });
    const data = await tmdb('/search/movie', { query: q.trim(), page });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Text search TV
searchRouter.get('/tv/query', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });
    const data = await tmdb('/search/tv', { query: q.trim(), page });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get image config (base URL for posters)
searchRouter.get('/config', async (req, res) => {
  try {
    const data = await tmdb('/configuration');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get movie or TV detail by id (includes credits and content rating)
searchRouter.get('/detail/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    if (type !== 'movie' && type !== 'tv') return res.status(400).json({ error: 'Invalid type' });
    const basePath = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;

    const [detail, credits, extra] = await Promise.all([
      tmdb(basePath, { language: 'en-US' }),
      tmdb(`${basePath}/credits`, { language: 'en-US' }),
      type === 'movie'
        ? tmdb(`${basePath}/release_dates`, {})
        : tmdb(`${basePath}/content_ratings`, {}),
    ]);

    if (detail.success === false) return res.json(detail);

    const cast = (credits.cast || []).slice(0, 12).map((c) => ({ name: c.name, character: c.character, profile_path: c.profile_path }));
    const directors = (credits.crew || []).filter((c) => c.job === 'Director').map((c) => c.name);
    const director = directors.length ? directors[0] : null;

    let certification = null;
    if (type === 'movie' && extra.results) {
      const us = extra.results.find((r) => r.iso_3166_1 === 'US');
      const withCert = us?.release_dates?.find((d) => d.certification && d.certification.trim());
      if (withCert?.certification) certification = withCert.certification;
    } else if (type === 'tv' && extra.results) {
      const us = extra.results.find((r) => r.iso_3166_1 === 'US');
      if (us?.rating) certification = us.rating;
    }

    res.json({ ...detail, cast, director, certification });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

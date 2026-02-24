import { useState, useEffect } from 'react';
import {
  getImageConfig,
  getMovieGenres,
  getTvGenres,
  discoverMovies,
  discoverTv,
  searchMovies,
  searchTv,
  searchKeywords,
  searchPeople,
  addToWatchlist,
  getMyWatchlists,
} from '../api';
import { parseDescription } from '../parseDescription';
import { Link } from 'react-router-dom';

// Use more specific TMDB keyword lookups for better relevance (e.g. "christmas movie" over "christmas")
const KEYWORD_LOOKUP_OVERRIDES = {
  christmas: 'christmas movie',
  halloween: 'halloween movie',
  holiday: 'holiday movie',
};

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity (high first)' },
  { value: 'popularity.asc', label: 'Popularity (low first)' },
  { value: 'vote_average.desc', label: 'Rating (high first)' },
  { value: 'vote_average.asc', label: 'Rating (low first)' },
  { value: 'primary_release_date.desc', label: 'Release date (new first)' },
  { value: 'primary_release_date.asc', label: 'Release date (old first)' },
  { value: 'first_air_date.desc', label: 'First air (new first)' },
  { value: 'first_air_date.asc', label: 'First air (old first)' },
];

export function Search() {
  const [type, setType] = useState('movie');
  const [config, setConfig] = useState(null);
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTvGenres] = useState([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    sort_by: 'popularity.desc',
    with_genres: '',
    year: '',
    'vote_average.gte': '',
    page: 1,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [watchlists, setWatchlists] = useState([]);
  const [addingToList, setAddingToList] = useState(null);

  useEffect(() => {
    getImageConfig().then(setConfig).catch(() => setConfig({ images: { secure_base_url: '', poster_sizes: ['w342'] } }));
    getMovieGenres().then((d) => setMovieGenres(d.genres || [])).catch(() => {});
    getTvGenres().then((d) => setTvGenres(d.genres || [])).catch(() => {});
    getMyWatchlists().then(setWatchlists).catch(() => setWatchlists([]));
  }, []);

  const genres = type === 'movie' ? movieGenres : tvGenres;
  const imgBase = config?.images?.secure_base_url || '';

  const runSearch = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const q = query.trim();
      if (q) {
        const parsed = parseDescription(q, type === 'movie');
        if (parsed.hasFilters) {
          const params = {
            page,
            sort_by: parsed.voteGte ? 'vote_average.desc'
              : type === 'tv' && filters.sort_by.includes('primary_release') ? 'first_air_date.desc' : filters.sort_by,
          };
          const voteGte = parsed.voteGte ?? filters['vote_average.gte'];
          if (voteGte) params['vote_average.gte'] = voteGte;
          if (parsed.genreIds.length) params.with_genres = parsed.genreIds.join(',');
          if (parsed.runtimeGte) params['with_runtime.gte'] = parsed.runtimeGte;
          if (parsed.runtimeLte) params['with_runtime.lte'] = parsed.runtimeLte;
          if (parsed.certification) {
            params.certification = parsed.certification;
            params.certification_country = parsed.certificationCountry || 'US';
          }
          if (parsed.originalLanguage) params.with_original_language = parsed.originalLanguage;
          if (parsed.castName) {
            try {
              const people = await searchPeople(parsed.castName);
              if (people.results?.[0]?.id) params.with_cast = people.results[0].id;
            } catch (_) {}
          }
          if (parsed.crewName) {
            try {
              const people = await searchPeople(parsed.crewName);
              if (people.results?.[0]?.id) params.with_crew = people.results[0].id;
            } catch (_) {}
          }
          const runDiscover = async (discoverParams) => {
            if (type === 'movie') {
              if (parsed.yearGte) discoverParams['primary_release_date.gte'] = `${parsed.yearGte}-01-01`;
              if (parsed.yearLte) discoverParams['primary_release_date.lte'] = `${parsed.yearLte}-12-31`;
              return discoverMovies(discoverParams);
            } else {
              if (parsed.yearGte) discoverParams['first_air_date.gte'] = `${parsed.yearGte}-01-01`;
              if (parsed.yearLte) discoverParams['first_air_date.lte'] = `${parsed.yearLte}-12-31`;
              return discoverTv(discoverParams);
            }
          };

          if (parsed.keywordTerms.length > 0) {
            const keywordIds = [];
            const termsToLookUp = parsed.keywordTermsUseOr ? parsed.keywordTerms : parsed.keywordTerms.slice(0, 3);
            for (const term of termsToLookUp) {
              try {
                const lookupTerm = KEYWORD_LOOKUP_OVERRIDES[term] ?? term;
                const kw = await searchKeywords(lookupTerm);
                if (kw.results?.[0]?.id) keywordIds.push(kw.results[0].id);
              } catch (_) {}
            }
            if (keywordIds.length > 0) {
              if (parsed.keywordTermsUseOr && keywordIds.length > 1) {
                const responses = await Promise.all(
                  keywordIds.map((id) => runDiscover({ ...params, with_keywords: String(id) }))
                );
                const seen = new Set();
                const merged = [];
                for (const res of responses) {
                  for (const item of res.results || []) {
                    if (!seen.has(item.id)) {
                      seen.add(item.id);
                      merged.push(item);
                    }
                  }
                }
                merged.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
                const pageSize = 20;
                const start = (page - 1) * pageSize;
                setResults({
                  results: merged.slice(start, start + pageSize),
                  page,
                  total_pages: Math.max(1, Math.ceil(merged.length / pageSize)),
                  total_results: merged.length,
                });
              } else {
                params.with_keywords = keywordIds.join(',');
                const data = await runDiscover(params);
                setResults(data);
              }
            } else {
              const data = await runDiscover(params);
              setResults(data);
            }
          } else {
            const data = await runDiscover(params);
            setResults(data);
          }
        } else {
          const fn = type === 'movie' ? searchMovies : searchTv;
          const data = await fn(q, page);
          setResults({ ...data, results: data.results || [] });
        }
      } else {
        const params = {
          page,
          sort_by: type === 'tv' && filters.sort_by.includes('primary_release') ? 'first_air_date.desc' : filters.sort_by,
          'vote_average.gte': filters['vote_average.gte'] || undefined,
        };
        if (filters.with_genres) params.with_genres = filters.with_genres;
        if (type === 'movie') {
          if (filters.year) params.primary_release_year = filters.year;
          const data = await discoverMovies(params);
          setResults(data);
        } else {
          if (filters.year) params.first_air_date_year = filters.year;
          const data = await discoverTv(params);
          setResults(data);
        }
      }
    } catch (e) {
      setError(e.message || 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(1);
  };

  const addToList = async (listId, item) => {
    setAddingToList(`${listId}-${item.type}-${item.id}`);
    try {
      await addToWatchlist(listId, {
        tmdbId: item.id,
        type: item.title ? 'movie' : 'tv',
        title: item.title || item.name,
        posterPath: item.poster_path,
        releaseDate: item.release_date || item.first_air_date,
        voteAverage: item.vote_average,
      });
      setWatchlists(await getMyWatchlists());
    } catch (_) {}
    setAddingToList(null);
  };

  const items = results?.results || [];
  const totalPages = results?.total_pages || 0;
  const currentPage = results?.page || 1;

  return (
    <div className="search-page">
      <h1>Discover films &amp; shows</h1>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row type-toggle">
          <button type="button" className={type === 'movie' ? 'active' : ''} onClick={() => setType('movie')}>Movies</button>
          <button type="button" className={type === 'tv' ? 'active' : ''} onClick={() => setType('tv')}>TV Shows</button>
        </div>

        <div className="form-row">
          <input
            type="text"
            placeholder="Search by title or describe what you want (e.g. romantic comedy from the 90s)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {!query.trim() && (
          <div className="filters">
            <div className="form-row">
              <label>Sort by</label>
              <select
                value={filters.sort_by}
                onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value }))}
              >
                {SORT_OPTIONS.filter((o) =>
                  type === 'movie' ? !o.value.startsWith('first_air') : !o.value.startsWith('primary_release')
                ).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Genre</label>
              <select
                value={filters.with_genres}
                onChange={(e) => setFilters((f) => ({ ...f, with_genres: e.target.value }))}
              >
                <option value="">Any</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Year</label>
              <input
                type="number"
                placeholder={type === 'movie' ? 'e.g. 2020' : 'e.g. 2020'}
                value={filters.year}
                onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
                min="1900"
                max="2030"
              />
            </div>
            <div className="form-row">
              <label>Min rating (0–10)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                placeholder="e.g. 7"
                value={filters['vote_average.gte']}
                onChange={(e) => setFilters((f) => ({ ...f, 'vote_average.gte': e.target.value }))}
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching…' : query.trim() ? 'Search' : 'Browse'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results && (
        <>
          <p className="results-count">
            {results.total_results != null ? `${results.total_results} results` : ''}
          </p>
          <div className="results-grid">
            {items.map((item) => (
              <div key={`${type}-${item.id}`} className="result-card">
                <Link to={`/detail/${type}/${item.id}`} className="poster-wrap">
                  {item.poster_path ? (
                    <img src={`${imgBase}w342${item.poster_path}`} alt="" />
                  ) : (
                    <div className="no-poster">{item.title || item.name}</div>
                  )}
                </Link>
                <div className="card-info">
                  <Link to={`/detail/${type}/${item.id}`} className="card-title">
                    {item.title || item.name}
                  </Link>
                  <p className="card-meta">
                    {(item.release_date || item.first_air_date)?.slice(0, 4)} · ★ {item.vote_average?.toFixed(1) || '—'}
                  </p>
                  {watchlists.length > 0 && (
                    <div className="add-to-list">
                      <select
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id) addToList(id, item);
                          e.target.value = '';
                        }}
                        disabled={!!addingToList}
                      >
                        <option value="">Add to list…</option>
                        {watchlists.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {watchlists.length === 0 && (
                    <Link to="/watchlists" className="link-small">Create a watchlist to save</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => runSearch(currentPage - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => runSearch(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Parses natural language search queries into TMDB discover filters.
 * Supports: genre terms, decades, years, and quality hints.
 */
const GENRE_TERMS = [
  { terms: ['romantic', 'romance', 'love story'], movieId: 10749, tvId: 10749 },
  { terms: ['comedy', 'comedies', 'funny'], movieId: 35, tvId: 35 },
  { terms: ['sci-fi', 'scifi', 'science fiction'], movieId: 878, tvId: 10765 },
  { terms: ['horror', 'scary'], movieId: 27, tvId: 27 },
  { terms: ['thriller', 'thrillers'], movieId: 53, tvId: 53 },
  { terms: ['action'], movieId: 28, tvId: 10759 },
  { terms: ['drama', 'dramas'], movieId: 18, tvId: 18 },
  { terms: ['animation', 'animated', 'cartoon'], movieId: 16, tvId: 16 },
  { terms: ['documentary', 'documentaries'], movieId: 99, tvId: 99 },
  { terms: ['family'], movieId: 10751, tvId: 10751 },
  { terms: ['adventure'], movieId: 12, tvId: 10759 },
  { terms: ['fantasy'], movieId: 14, tvId: 10765 },
  { terms: ['mystery', 'mysteries'], movieId: 9648, tvId: 9648 },
  { terms: ['crime'], movieId: 80, tvId: 80 },
  { terms: ['war'], movieId: 10752, tvId: 10768 },
  { terms: ['western'], movieId: 37, tvId: 37 },
];

const DECADES = [
  { pattern: /\b(90s|nineties|'90s)\b/i, gte: 1990, lte: 1999 },
  { pattern: /\b(80s|eighties|'80s)\b/i, gte: 1980, lte: 1989 },
  { pattern: /\b(70s|seventies|'70s)\b/i, gte: 1970, lte: 1979 },
  { pattern: /\b(60s|sixties|'60s)\b/i, gte: 1960, lte: 1969 },
  { pattern: /\b(2000s|naughties)\b/i, gte: 2000, lte: 2009 },
  { pattern: /\b(2010s|tens)\b/i, gte: 2010, lte: 2019 },
  { pattern: /\b(2020s|twenties)\b/i, gte: 2020, lte: 2029 },
];

const RATING_TERMS = /\b(good rating|high rated|well rated|high rating|highly rated|top rated)\b/i;

export function parseDescription(query, isMovie = true) {
  const q = String(query).trim().toLowerCase();
  const result = { genreIds: [], yearGte: null, yearLte: null, voteGte: null };

  // Extract genres
  for (const { terms, movieId, tvId } of GENRE_TERMS) {
    if (terms.some((t) => q.includes(t))) {
      result.genreIds.push(isMovie ? movieId : tvId);
    }
  }

  // Extract decade
  for (const { pattern, gte, lte } of DECADES) {
    if (pattern.test(q)) {
      result.yearGte = gte;
      result.yearLte = lte;
      break;
    }
  }

  // Extract specific year (e.g. 1995, 2020)
  if (!result.yearGte) {
    const yearMatch = q.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      result.yearGte = y;
      result.yearLte = y;
    }
  }

  // "from 2015" / "after 2010"
  const fromMatch = q.match(/\b(?:from|after|since)\s+(\d{4})\b/i);
  if (fromMatch) result.yearGte = parseInt(fromMatch[1], 10);

  // "before 2000"
  const beforeMatch = q.match(/\bbefore\s+(\d{4})\b/i);
  if (beforeMatch) result.yearLte = parseInt(beforeMatch[1], 10) - 1;

  // Rating hint
  if (RATING_TERMS.test(q)) result.voteGte = 7;

  const hasFilters = result.genreIds.length > 0 || result.yearGte || result.yearLte || result.voteGte;
  return { ...result, hasFilters };
}

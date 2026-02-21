/**
 * Parses natural language search queries into TMDB discover filters.
 * Supports: genre terms, keyword terms, decades, years, runtime, certification, language.
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
  { terms: ['historical', 'history', 'period piece', 'period film', 'period drama', 'costume drama', 'based on true events', 'medieval', 'victorian', 'elizabethan', 'renaissance', 'ancient rome', 'ancient greece', 'world war', 'civil war', 'royalty', 'royal'], movieId: 36, tvId: 18 },
  { terms: ['courtroom', 'court room', 'court room drama', 'legal drama'], movieId: 18, tvId: 18 },
  { terms: ['musical', 'musicals', 'music'], movieId: 10402, tvId: 10402 },
  { terms: ['adaptation', 'adaptations', 'adapted from', 'book to film'], movieId: 18, tvId: 18 },
  // Mood descriptors
  { terms: ['light-hearted', 'lighthearted', 'charming', 'whimsical', 'feel-good', 'feel good'], movieId: 35, tvId: 35 },
  { terms: ['melancholic', 'intense', 'nostalgic', 'inspirational', 'hopeful', 'dramatic', 'pensive', 'heartfelt', 'thought-provoking', 'thought provoking', 'grounded', 'character-driven', 'character driven'], movieId: 18, tvId: 18 },
  { terms: ['thrilling', 'edgy', 'dark', 'plot twist', 'clever', 'mind-bending', 'mind bending'], movieId: 53, tvId: 53 },
  { terms: ['heartwarming', 'cult classic'], movieId: 10751, tvId: 10751 },
  { terms: ['fast-paced', 'fast paced'], movieId: 28, tvId: 10759 },
  // Aesthetic descriptors
  { terms: ['noir', 'film noir', 'urban'], movieId: 80, tvId: 80 },
  { terms: ['dark comedy', 'dark humor'], movieId: 35, tvId: 35 },
  { terms: ['slice of life', 'slice-of-life'], movieId: 18, tvId: 18 },
  { terms: ['post-apocalyptic', 'post apocalyptic', 'cyberpunk'], movieId: 878, tvId: 10765 },
  { terms: ['surreal', 'artistic', 'minimalist', 'graphic novel style', 'visually stunning', 'cinematically rich', 'fantasy realism'], movieId: 14, tvId: 10765 },
  { terms: ['vintage', 'retro'], movieId: 36, tvId: 18 },
  { terms: ['epic'], movieId: 12, tvId: 10759 },
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

const RATING_TERMS = /\b(good rating|high rated|well rated|high rating|highly rated|top rated|acclaimed|critically acclaimed|award winning|best|top)\b/i;

// Terms to look up as TMDB keywords (adds nuance beyond genres)
const KEYWORD_TERMS = [
  'courtroom', 'heist', 'noir', 'film noir', 'cyberpunk', 'time travel', 'zombie', 'vampire',
  'superhero', 'based on novel', 'female director', 'female protagonist', 'twist ending',
  'post-apocalyptic', 'dystopia', 'romantic comedy', 'buddy', 'road movie', 'revenge',
  'psychological thriller', 'coming of age', 'found family',
];

// Runtime: term -> { gte, lte } in minutes
const RUNTIME_MAP = [
  { terms: ['short', 'under 90', 'under 90 minutes', 'quick watch'], lte: 90 },
  { terms: ['under 2 hours', 'under 120'], lte: 120 },
  { terms: ['long', 'over 2 hours', 'epic length'], gte: 120 },
  { terms: ['over 3 hours'], gte: 180 },
];

// Certification (US)
const CERTIFICATION_MAP = [
  { terms: ['family friendly', 'family-friendly', 'kid friendly', 'kids'], cert: 'G' },
  { terms: ['pg', 'suitable for kids'], cert: 'PG' },
  { terms: ['pg-13', 'pg13'], cert: 'PG-13' },
  { terms: ['r rated', 'r-rated', 'adult', 'mature'], cert: 'R' },
  { terms: ['nc-17'], cert: 'NC-17' },
];

// Language (ISO 639-1)
const LANGUAGE_MAP = [
  { terms: ['french', 'france'], lang: 'fr' },
  { terms: ['spanish', 'spanish language', 'mexican'], lang: 'es' },
  { terms: ['japanese', 'anime'], lang: 'ja' },
  { terms: ['korean', 'k-drama'], lang: 'ko' },
  { terms: ['german'], lang: 'de' },
  { terms: ['italian'], lang: 'it' },
  { terms: ['hindi', 'bollywood'], lang: 'hi' },
];

export function parseDescription(query, isMovie = true) {
  const q = String(query).trim().toLowerCase();
  const result = {
    genreIds: [],
    keywordTerms: [],
    yearGte: null,
    yearLte: null,
    voteGte: null,
    runtimeGte: null,
    runtimeLte: null,
    certification: null,
    certificationCountry: 'US',
    originalLanguage: null,
    castName: null,
    crewName: null,
  };

  // Extract genres (dedupe when multiple term groups map to same genre)
  for (const { terms, movieId, tvId } of GENRE_TERMS) {
    if (terms.some((t) => q.includes(t))) {
      const id = isMovie ? movieId : tvId;
      if (!result.genreIds.includes(id)) result.genreIds.push(id);
    }
  }

  // Extract keyword terms (for TMDB keyword lookup)
  for (const term of KEYWORD_TERMS) {
    if (q.includes(term)) result.keywordTerms.push(term);
  }

  // Runtime
  for (const { terms, gte, lte } of RUNTIME_MAP) {
    if (terms.some((t) => q.includes(t))) {
      if (gte) result.runtimeGte = gte;
      if (lte) result.runtimeLte = lte;
      break;
    }
  }

  // Certification
  for (const { terms, cert } of CERTIFICATION_MAP) {
    if (terms.some((t) => q.includes(t))) {
      result.certification = cert;
      break;
    }
  }

  // Language
  for (const { terms, lang } of LANGUAGE_MAP) {
    if (terms.some((t) => q.includes(t))) {
      result.originalLanguage = lang;
      break;
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

  // Cast: "with Tom Hanks", "starring Meryl Streep"
  const castMatch = q.match(/\b(?:with|starring|featuring)\s+([a-z\s.']+?)(?:\s+from|\s+in|$|,)/i);
  if (castMatch) result.castName = castMatch[1].trim();

  // Crew: "directed by Nolan", "directed by Christopher Nolan"
  const directorMatch = q.match(/\bdirected\s+by\s+([a-z\s.']+?)(?:\s+from|\s+in|$|,)/i);
  if (directorMatch) result.crewName = directorMatch[1].trim();

  const hasFilters =
    result.genreIds.length > 0 ||
    result.keywordTerms.length > 0 ||
    result.yearGte ||
    result.yearLte ||
    result.voteGte ||
    result.runtimeGte ||
    result.runtimeLte ||
    result.certification ||
    result.originalLanguage ||
    result.castName ||
    result.crewName;
  return { ...result, hasFilters };
}

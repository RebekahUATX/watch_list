/**
 * Parses natural language search queries into TMDB discover filters.
 * Supports: genre terms, keyword terms, decades, years, runtime, certification, language.
 */
const GENRE_TERMS = [
  { terms: ['romantic', 'romance', 'rom com', 'romcom', 'love story'], movieId: 10749, tvId: 10749 },
  { terms: ['comedy', 'comedies', 'funny', 'comedic'], movieId: 35, tvId: 35 },
  { terms: ['sci-fi', 'scifi', 'science fiction'], movieId: 878, tvId: 10765 },
  { terms: ['horror', 'scary', 'scary movie', 'horror movie'], movieId: 27, tvId: 27 },
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

const RATING_TERMS = /\b(good rating|high rated|well rated|high rating|highly rated|top rated|acclaimed|critically acclaimed|award winning|best|top|7\+|8\+|9\+|above 7|above 8|minimum rating)\b/i;

// Terms to look up as TMDB keywords (adds nuance beyond genres; respects specific descriptors)
const KEYWORD_TERMS = [
  // Structural / plot
  'courtroom', 'heist', 'noir', 'film noir', 'cyberpunk', 'time travel', 'zombie', 'vampire',
  'superhero', 'based on novel', 'female director', 'female protagonist', 'twist ending',
  'post-apocalyptic', 'dystopia', 'romantic comedy', 'buddy', 'road movie', 'revenge',
  'psychological thriller', 'coming of age', 'found family',
  // Mood / tone (keyword lookup instead of genre collapse)
  'light-hearted', 'lighthearted', 'charming', 'whimsical', 'feel good', 'feel-good', 'uplifting', 'cozy',
  'melancholic', 'melancholy', 'intense', 'nostalgic', 'inspirational', 'hopeful', 'heartfelt',
  'thought provoking', 'grounded', 'character driven', 'emotional', 'heartwarming', 'cult classic', 'dark',
  // Style / pace
  'thrilling', 'edgy', 'plot twist', 'clever', 'mind bending', 'mind-bending', 'fast-paced', 'fast paced',
  // Aesthetic
  'urban', 'dark comedy', 'dark humor', 'slice of life', 'slice-of-life', 'surreal', 'artistic',
  'minimalist', 'vintage', 'retro', 'epic', 'visually stunning',
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
  { terms: ['family friendly', 'family-friendly', 'kid friendly', 'kids', 'g rated', 'g-rated'], cert: 'G' },
  { terms: ['pg', 'pg rated', 'suitable for kids'], cert: 'PG' },
  { terms: ['pg-13', 'pg13', 'pg 13'], cert: 'PG-13' },
  { terms: ['r rated', 'r-rated', 'r rated movie', 'adult', 'mature'], cert: 'R' },
  { terms: ['nc-17', 'nc17'], cert: 'NC-17' },
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

  // Helper: match term as whole word or phrase (order-independent)
  const matchesTerm = (term) => {
    if (term.includes(' ')) return q.includes(term);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\b' + escaped + '\\b', 'i').test(q);
  };

  // Extract genres (dedupe when multiple term groups map to same genre)
  for (const { terms, movieId, tvId } of GENRE_TERMS) {
    if (terms.some(matchesTerm)) {
      const id = isMovie ? movieId : tvId;
      if (!result.genreIds.includes(id)) result.genreIds.push(id);
    }
  }

  // Extract keyword terms (for TMDB keyword lookup)
  for (const term of KEYWORD_TERMS) {
    if (matchesTerm(term)) result.keywordTerms.push(term);
  }

  // Runtime
  for (const { terms, gte, lte } of RUNTIME_MAP) {
    if (terms.some(matchesTerm)) {
      if (gte) result.runtimeGte = gte;
      if (lte) result.runtimeLte = lte;
      break;
    }
  }

  // Certification
  for (const { terms, cert } of CERTIFICATION_MAP) {
    if (terms.some(matchesTerm)) {
      result.certification = cert;
      break;
    }
  }

  // Language
  for (const { terms, lang } of LANGUAGE_MAP) {
    if (terms.some(matchesTerm)) {
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
  if (!result.yearGte && !result.yearLte) {
    const yearMatch = q.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      result.yearGte = y;
      result.yearLte = y;
    }
  }

  // "from 2015" / "after 2010" / "released in 2020" / "released 2020"
  const fromMatch = q.match(/\b(?:from|after|since)\s+(?:the\s+)?(\d{4})\b/i);
  if (fromMatch && !result.yearGte) result.yearGte = parseInt(fromMatch[1], 10);

  const releasedMatch = q.match(/\breleased\s+(?:in\s+)?(\d{4})\b/i) || q.match(/\b(\d{4})\s*(?:release|movie|film|movies)\b/i);
  if (releasedMatch && !result.yearGte) {
    const y = parseInt(releasedMatch[1], 10);
    result.yearGte = y;
    result.yearLte = y;
  }

  // "before 2000"
  const beforeMatch = q.match(/\bbefore\s+(\d{4})\b/i);
  if (beforeMatch) result.yearLte = parseInt(beforeMatch[1], 10) - 1;

  // Rating hint - explicit numbers: "rated 8", "8 stars", "8+", "minimum 7.5"
  const ratedNumMatch = q.match(/\b(?:rated|rating|stars?|minimum|min)\s*(\d(?:\.\d)?)\b|\b(\d(?:\.\d)?)\s*stars?\b|\b(\d(?:\.\d)?)\+\s*(?:rating|stars?)?\b/i);
  if (ratedNumMatch) {
    const num = parseFloat(ratedNumMatch[1] || ratedNumMatch[2] || ratedNumMatch[3] || 0);
    if (num > 0) result.voteGte = num;
  } else if (RATING_TERMS.test(q)) result.voteGte = result.voteGte ?? 7;

  // Cast: "with Tom Hanks", "starring Meryl Streep", "featuring X", "actor X" (name must start with letter)
  const castMatch = q.match(/\b(?:with|starring|featuring|actor)\s+([a-z][a-z0-9\s.'-]*?)(?:\s+from|\s+in|\s+and|\s*$|,|\.)/i);
  if (castMatch) result.castName = castMatch[1].trim().replace(/\s+/g, ' ');

  // Crew: "directed by Nolan", "director Nolan", "by Christopher Nolan" (name must start with letter to avoid "by 2020")
  let directorMatch = q.match(/\b(?:directed\s+by|director)\s+([a-z][a-z0-9\s.'-]*?)(?:\s+from|\s+in|\s+and|\s*$|,|\.)/i);
  if (!directorMatch) directorMatch = q.match(/\bby\s+([a-z][a-z0-9\s.'-]+?)\s*$/i);
  if (directorMatch) result.crewName = directorMatch[1].trim().replace(/\s+/g, ' ');

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

const ALLOWED_GENRES = new Set([
  'fiction',
  'non-fiction',
  'science',
  'history',
  'fantasy',
  'other',
]);

const ALLOWED_SORT_FIELDS = new Set(['title', 'author', 'year', 'rating']);
const ALLOWED_ORDERS = new Set(['asc', 'desc']);
const ALLOWED_QUERY_KEYS = new Set([
  'genre',
  'read',
  'q',
  'sort',
  'order',
  'limit',
  'page',
]);

export function parsePositiveInt(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateTitle(value) {
  if (typeof value !== 'string') {
    return { error: 'Title must be a string' };
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { error: 'Title must be between 1 and 100 characters after trimming' };
  }
  return { value: trimmed };
}

function validateAuthor(value) {
  if (typeof value !== 'string') {
    return { error: 'Author must be a string' };
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { error: 'Author must be between 1 and 100 characters after trimming' };
  }
  return { value: trimmed };
}

function validateYear(value) {
  const currentYear = new Date().getFullYear();
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return { error: `Year must be an integer between 1000 and ${currentYear}` };
  }
  if (value < 1000 || value > currentYear) {
    return { error: `Year must be between 1000 and ${currentYear}` };
  }
  return { value };
}

function validateGenre(value) {
  if (typeof value !== 'string' || !ALLOWED_GENRES.has(value)) {
    return {
      error:
        'Genre must be one of: fiction, non-fiction, science, history, fantasy, other',
    };
  }
  return { value };
}

function validateRead(value) {
  if (typeof value !== 'boolean') {
    return { error: 'Read must be a boolean' };
  }
  return { value };
}

function validateRating(value, read) {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
    return { error: 'Rating must be an integer from 1 to 5, or null' };
  }
  if (!read) {
    return { error: 'Rating is only allowed when read is true' };
  }
  return { value };
}

export function validateFullBookBody(body) {
  if (!isPlainObject(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  const titleRes = validateTitle(body.title);
  if (titleRes.error) return { error: titleRes.error };

  const authorRes = validateAuthor(body.author);
  if (authorRes.error) return { error: authorRes.error };

  const yearRes = validateYear(body.year);
  if (yearRes.error) return { error: yearRes.error };

  const genreRes = validateGenre(body.genre);
  if (genreRes.error) return { error: genreRes.error };

  const readValue = body.read === undefined ? false : body.read;
  const readRes = validateRead(readValue);
  if (readRes.error) return { error: readRes.error };

  const ratingValue = body.rating === undefined ? null : body.rating;
  const ratingRes = validateRating(ratingValue, readRes.value);
  if (ratingRes.error) return { error: ratingRes.error };

  return {
    value: {
      title: titleRes.value,
      author: authorRes.value,
      year: yearRes.value,
      genre: genreRes.value,
      read: readRes.value,
      rating: ratingRes.value,
    },
  };
}

export function validatePatchBook(existingBook, patchBody) {
  if (!isPlainObject(patchBody)) {
    return { error: 'Request body must be a JSON object' };
  }

  const candidate = {
    title: patchBody.title !== undefined ? patchBody.title : existingBook.title,
    author: patchBody.author !== undefined ? patchBody.author : existingBook.author,
    year: patchBody.year !== undefined ? patchBody.year : existingBook.year,
    genre: patchBody.genre !== undefined ? patchBody.genre : existingBook.genre,
    read: patchBody.read !== undefined ? patchBody.read : existingBook.read,
    rating: patchBody.rating !== undefined ? patchBody.rating : existingBook.rating,
  };

  return validateFullBookBody(candidate);
}

export function validateBooksQuery(query) {
  if (!isPlainObject(query)) {
    return { error: 'Invalid query parameters' };
  }

  for (const [key, rawVal] of Object.entries(query)) {
    if (!ALLOWED_QUERY_KEYS.has(key)) {
      return { error: `Unknown query parameter: ${key}` };
    }
    if (Array.isArray(rawVal)) {
      return { error: `Repeated query parameter is not allowed: ${key}` };
    }
  }

  let genre = null;
  if (query.genre !== undefined) {
    if (typeof query.genre !== 'string' || !ALLOWED_GENRES.has(query.genre)) {
      return { error: 'Invalid genre query parameter' };
    }
    genre = query.genre;
  }

  let read = null;
  if (query.read !== undefined) {
    if (query.read === 'true') {
      read = true;
    } else if (query.read === 'false') {
      read = false;
    } else {
      return { error: 'Invalid read query parameter (must be true or false)' };
    }
  }

  let q = '';
  if (query.q !== undefined) {
    if (typeof query.q !== 'string') {
      return { error: 'Invalid q query parameter' };
    }
    q = query.q.trim().toLowerCase();
  }

  let sort = 'id';
  if (query.sort !== undefined) {
    if (typeof query.sort !== 'string' || !ALLOWED_SORT_FIELDS.has(query.sort)) {
      return {
        error: 'Invalid sort query parameter (must be title, author, year, or rating)',
      };
    }
    sort = query.sort;
  }

  let order = 'asc';
  if (query.order !== undefined) {
    if (typeof query.order !== 'string' || !ALLOWED_ORDERS.has(query.order)) {
      return { error: 'Invalid order query parameter (must be asc or desc)' };
    }
    order = query.order;
  }

  let limit = 50;
  if (query.limit !== undefined) {
    const parsedLimit = parsePositiveInt(query.limit);
    if (!parsedLimit || parsedLimit < 1 || parsedLimit > 50) {
      return { error: 'Invalid limit query parameter (must be an integer from 1 to 50)' };
    }
    limit = parsedLimit;
  }

  let page = 1;
  if (query.page !== undefined) {
    const parsedPage = parsePositiveInt(query.page);
    if (!parsedPage) {
      return { error: 'Invalid page query parameter (must be a positive integer)' };
    }
    page = parsedPage;
  }

  return {
    value: {
      genre,
      read,
      q,
      sort,
      order,
      limit,
      page,
    },
  };
}

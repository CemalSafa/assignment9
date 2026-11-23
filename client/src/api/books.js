const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

function buildUrl(path, queryParams) {
  const url = new URL(`${BASE_URL}${path}`);

  if (queryParams) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      url.search = qs;
    }
  }

  return url.toString();
}

async function request(path, { method = 'GET', body, query, signal } = {}) {
  const headers = {};
  const hasBody = body !== undefined && body !== null;

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message =
      data && typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function fetchBooks(query = {}, signal) {
  return request('/api/books', { method: 'GET', query, signal });
}

export function fetchStats(signal) {
  return request('/api/stats', { method: 'GET', signal });
}

export function createBookApi(bookData) {
  return request('/api/books', { method: 'POST', body: bookData });
}

export function replaceBookApi(id, bookData) {
  return request(`/api/books/${id}`, { method: 'PUT', body: bookData });
}

export function patchBookApi(id, patchData) {
  return request(`/api/books/${id}`, { method: 'PATCH', body: patchData });
}

export function deleteBookApi(id) {
  return request(`/api/books/${id}`, { method: 'DELETE' });
}

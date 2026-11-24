# Assignment 9 - Reading List

Full-stack Reading List app: Express 5 REST API + React (Vite) client.

## Install and run
- Verified full-stack flow with Express API on port 3000 and Vite client on port 5173.
- ### Server
```bash
cd server
npm install
npm run dev      # or: npm start
```
Environment variables (optional):
- `PORT`: server port, defaults to `3000`
- `CLIENT_ORIGIN`: the one allowed client origin, defaults to `http://localhost:5173`

### Client
```bash
cd client
npm install
cp .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```
Environment variable:
- `VITE_API_URL`: base URL of the API (see `client/.env.example`)

Server runs on http://localhost:3000, client on http://localhost:5173.

## File organization
```
assignment9/
├─ server/
│  ├─ server.js       # Express app, CORS, routes, error handling
│  ├─ booksStore.js   # in-memory async data layer (immutable updates)
│  ├─ validate.js     # server-side validation
│  └─ package.json
├─ client/
│  ├─ src/
│  │  ├─ api/books.js # all fetch calls
│  │  ├─ components/
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ .env.example
│  └─ package.json
├─ .gitignore
└─ README.md
```


## curl and preflight evidence

Experiment and observation:
**Experiment: what happens if express.json() is moved below the routes?**
I moved `app.use(express.json())` below the routes and sent a valid JSON body with a POST to `/api/books`. The server returned `400 Bad Request` with `{"error":"Request body must be a JSON object"}`. Express only fills `req.body` when the body parser runs before the route handler. Since the routes ran first, `req.body` stayed `undefined` and my validation rejected it, so even a correct JSON body was treated as invalid. The parser must be registered before the routes.



## Reasoning questions
Why validate input in server/validate.js instead of trusting the React client?
Client-side controls can be bypassed directly via curl, browser tools, or custom scripts, and invalid fields could corrupt in-memory state or cause runtime errors. Server-side validation in server/validate.js checks types, ranges, allowed enums, read/rating rules, and query parameters at the API boundary. Every invalid input is rejected consistently with status 400 and { "error": "..." } before reaching booksStore.js.

What happens if express.json() is placed after route handlers instead of before them?
When express.json() is placed after route handlers, req.body is still undefined when POST, PUT, or PATCH handlers run. Body validation then treats valid JSON requests as invalid (400) because the incoming body stream was never parsed into an object beforehand. Placing app.use(express.json()) before routes ensures JSON bodies are parsed and malformed JSON syntax errors are caught early.

Why is return essential after sending an early error response like res.status(404).json(...)?
In Express, calling res.status(404).json(...) writes the response but does not stop execution of the rest of the route or handler function. Without return, execution can continue into later lines that dereference a missing resource or attempt to send a second response, causing a 500 error or ERR_HTTP_HEADERS_SENT. Adding return ensures each branch exits immediately after sending its response.

Why should PUT replace the full resource while PATCH applies partial updates, and why is rating restricted when read is false?
PUT replaces the entire book representation and requires/validates all book fields together, whereas PATCH applies partial changes onto the existing book and validates the resulting complete book. Allowing a rating when read is false would produce contradictory domain data where an unread book has a reading rating. Enforcing rating === null when read is false keeps the book state consistent across both the server and the UI.

What happens when CLIENT_ORIGIN is set to a different origin (e.g., http://localhost:9999) while the client runs on http://localhost:5173?
When the React app on http://localhost:5173 requests the API, the server sends Access-Control-Allow-Origin: http://localhost:9999, which does not match the page origin. The browser blocks script access to the response and logs a CORS policy error in the console, while curl still receives responses because CORS is enforced by browsers rather than non-browser HTTP clients. Meanwhile, server logs only show incoming requests if request logging is added, not browser rejection details.

Why does the client use AbortController when search, filter, or sort controls change rapidly?
Rapidly typing in the search input or switching filter/sort dropdowns can trigger overlapping GET /api/books requests. Without AbortController, an earlier slower response could arrive after a newer response and overwrite the UI with outdated results. Aborting prior requests and ignoring AbortError avoids race conditions and ensures the list matches the latest controls.

What happens to books and nextId when the server restarts, and why?
Because booksStore.js keeps state in memory (let books and let nextId initialized from INITIAL_BOOKS), restarting the server resets the store back to the 6 initial seed books and resets nextId to 7. Any books added, modified, or deleted during the previous run are not persisted to disk or a database. Restarting the process therefore starts fresh from the seed dataset.

## Self-study notes
URLSearchParams: Builds clean query strings from non-empty filter and sort values (q, genre, read, sort, order) without manual string concatenation errors.

localeCompare: Compares text fields like title and author using locale-aware rules (sensitivity: 'base') for consistent alphabetical sorting instead of raw character codes.

import.meta.env and VITE_ prefix: Vite only exposes variables prefixed with VITE_ to client code via import.meta.env, making the API base URL explicit without using a dev-server proxy.

204 No Content in Express 5: res.status(204).send() sends an empty response body with status 204, so the client helper checks response.status === 204 and returns null instead of calling response.json().

fetch cancellation and AbortError: Passing an AbortController signal cancels superseded requests cleanly and throws an AbortError that the client ignores when err.name === 'AbortError'.

## Challenges
PowerShell quoting and line-ending rules when running multi-line commands and sending JSON via curl.exe required careful escaping so requests and evidence_curl.txt outputs were recorded cleanly.

Keeping form state synchronized—such as clearing/disabling rating when read is unchecked and resetting edit mode—while matching strict server-side validation rules required careful state handling in App.jsx and BookForm.jsx.





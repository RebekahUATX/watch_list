# FilmList

A personal movie and TV show watchlist app. Search for films and shows, create watchlists, mark titles as watched, and share lists with others.

**Live site:** [filmlist.net](https://filmlist.net)

---

## Synopsis

FilmList lets you discover movies and TV shows, organize them into watchlists, and track what you've watched. Recent updates include:

- **PostgreSQL persistence** — Watchlists are stored in a database on production (Railway), so they survive page refreshes and redeploys.
- **Natural-language search** — Type what you're in the mood for (e.g. "romantic comedy from the 90s", "christmas movie") and get tailored results.
- **Trailer support** — Watch official trailers directly from each title's detail page.
- **Watchlist indicators** — Gold stars (★) show items saved to lists; green checks (✓) show items marked as watched.
- **Add from anywhere** — Add titles to watchlists from search results or from the detail page.
- **Share lists** — Create shareable links so others can view your watchlists.
- **Search state preserved** — Your search results and filters are kept when you go to a detail page and come back.

---

## How to Operate the App

### Search
- **Search bar:** Type keywords or describe what you want (e.g. "horror movie", "feel-good comedy"). Press Enter or click Search.
- **Movies / TV toggle:** Switch between movie and TV results.
- **Filters:** Use genre, year, rating, and sort options to narrow results.
- **Infinite scroll:** Scroll down to load more results.
- **Stars and checks:** Gold ★ = saved to a watchlist; green ✓ = marked as watched.

### Detail Page
- Click a poster or title to open the full detail page.
- **Add to watchlist:** Use the dropdown to pick a list and add the title.
- **Watch trailer:** Click the button under the cast to open a modal with the official trailer (YouTube).
- **Back to search:** Click "← Back to search" to return with your previous results intact.

### Watchlists
- **My Watchlists:** View all your lists. Create new ones or open existing ones.
- **Inside a watchlist:**
  - **Add items:** Click "Add to watchlist" and search for movies or shows to add.
  - **Mark as watched:** Click "Mark as watched" on any item (shows ✓ when done).
  - **Remove:** Remove items you no longer want.
  - **Share:** If the list is shared, copy the link to share with others.
- **Shared:** Paste a share code or link to view someone else's watchlist.

---

## Features

- Search movies and TV shows by title or natural-language query
- Browse by genre, year, rating, and multiple sort options
- Infinite scroll for search results
- Create and manage multiple watchlists
- Add items from search results or the detail page
- Mark items as watched with a green check
- Visual indicators: gold star for saved, green check for watched
- Share watchlists via unique link codes
- Watch official trailers in an overlay modal
- View detailed info (cast, overview, rating) for each title
- Search state preserved when navigating to/from detail pages
- Persistent storage (PostgreSQL on production; JSON file locally)

---

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express
- **Data:** TMDB (The Movie Database) API
- **Storage:** File-based JSON (local) or PostgreSQL (when `DATABASE_URL` is set)
- **Hosting:** Railway

---

## Run Locally

1. Clone the repo:
   ```bash
   git clone https://github.com/RebekahUATX/watch_list.git
   cd watch_list
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root (copy from `.env.example`):
   ```
   TMDB_API_KEY=your_tmdb_api_key
   PORT=3001
   ```
   Get a free API key at [themoviedb.org](https://www.themoviedb.org/settings/api).

4. Start the app:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

Locally, watchlists are stored in `server/data/watchlists.json`. No database required.

---

## Deploy to Railway (Production)

1. Connect your GitHub repo to Railway and deploy.
2. Add a **PostgreSQL** database: click **+ Create** → **Database** → **Add PostgreSQL**.
3. In the **watch_list** service, open **Variables** and add `DATABASE_URL` with the reference:
   `${{Postgres.DATABASE_URL}}`  
   (Railway resolves this to the real connection string from your Postgres service.)
4. Redeploy. Watchlists will now persist across refreshes and deploys.

---

## Scripts

| Command        | Description                     |
|----------------|---------------------------------|
| `npm run dev`  | Start dev server (client + API) |
| `npm run build`| Build for production            |
| `npm start`    | Build and run production        |

---

## Project Structure

```
watch_list/
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Search, Watchlists, WatchlistDetail, Detail, Shared, SharedView
│       ├── api.js       # API helpers
│       └── parseDescription.js  # Natural-language query parsing
├── server/
│   ├── routes/          # search, watchlist, genres
│   ├── store.js         # Storage abstraction (file or Postgres)
│   ├── store-postgres.js # PostgreSQL-backed store
│   └── data/            # watchlists.json (local file store)
└── package.json
```

---

## License

MIT

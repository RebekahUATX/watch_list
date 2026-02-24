# FilmList

A personal movie and TV show watchlist app. Search for films and shows, create watchlists, and share them with others.

**Live site:** [filmlist.net](https://filmlist.net)

---

## Features

- Search for movies and TV shows
- Browse by genre, year, rating, and more
- Create and manage multiple watchlists
- Share watchlists via unique link codes
- View detailed info for each title

---

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express
- **Data:** TMDB (The Movie Database) API
- **Storage:** File-based JSON (local) or PostgreSQL (when `DATABASE_URL` is set)
- **Hosting:** Railway

For production on Railway, add a PostgreSQL database and set `DATABASE_URL` so watchlists persist across deploys.

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

---

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start dev server (client + API)|
| `npm run build`| Build for production           |
| `npm start`    | Build and run production       |

---

## Project Structure

```
watch_list/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Search, Watchlists, Detail, etc.
│       └── api.js   # API helpers
├── server/          # Express backend
│   ├── routes/      # search, watchlist, genres
│   └── store.js     # Watchlist data storage
└── package.json
```

---

## License

MIT

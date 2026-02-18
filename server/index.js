import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { searchRouter } from './routes/search.js';
import { watchlistRouter } from './routes/watchlist.js';
import { genresRouter } from './routes/genres.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/search', searchRouter);
app.use('/api/watchlists', watchlistRouter);
app.use('/api/genres', genresRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Serve built React app in production (when client/dist exists)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

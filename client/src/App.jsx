import { Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { Search } from './pages/Search';
import { Watchlists } from './pages/Watchlists';
import { WatchlistDetail } from './pages/WatchlistDetail';
import { Shared } from './pages/Shared';
import { SharedView } from './pages/SharedView';
import { Detail } from './pages/Detail';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Search />} />
        <Route path="watchlists" element={<Watchlists />} />
        <Route path="watchlists/:id" element={<WatchlistDetail />} />
        <Route path="shared" element={<Shared />} />
        <Route path="shared/:shareCode" element={<SharedView />} />
        <Route path="detail/:type/:id" element={<Detail />} />
      </Route>
    </Routes>
  );
}

export default App;

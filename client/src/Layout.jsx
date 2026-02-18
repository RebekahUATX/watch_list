import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path || loc.pathname.startsWith(path + '/');

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">Watch List</Link>
        <nav>
          <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>Search</Link>
          <Link to="/watchlists" className={isActive('/watchlists') ? 'active' : ''}>My Watchlists</Link>
          <Link to="/shared" className={isActive('/shared') ? 'active' : ''}>Open shared list</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

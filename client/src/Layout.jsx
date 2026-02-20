import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path || loc.pathname.startsWith(path + '/');

  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo-wrap">
          <Link to="/" className="logo">Watch List</Link>
        </h1>
        <nav className="nav">
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

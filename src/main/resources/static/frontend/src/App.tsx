import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { MoonIcon, SunIcon } from './components/Icons';
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';

const navigation = [
  { label: 'Home', path: '/' },
  { label: 'Students', path: '/students' },
  { label: 'Modules', path: '/modules' },
  { label: 'APIs hub', path: '/doc-api/' },
];

const App = () => {
  const { user, openAuth, logout } = useAuth();
  const preferredTheme = useMemo<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(preferredTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const themeIcon = theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />;
  const themeLabel = theme === 'light' ? 'Dark mode' : 'Light mode';

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-14">
        <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/5 px-6 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700 shadow-inner"></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">UCL COMP0010</p>
              <p className="text-lg font-semibold">Management Centre</p>
            </div>
          </div>
          <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/5 px-2 py-1 text-sm font-medium text-slate-200 shadow-inner shadow-black/30 ring-1 ring-white/10 sm:order-none sm:w-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full transition duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-lg shadow-white/20'
                      : 'hover:bg-white/10 hover:text-white'
                  }`
                }
                end={item.path === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-2" ref={menuRef}>
            {user ? (
              <div className="hidden rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10 shadow-inner shadow-black/30 sm:block">
                Signed in as <span className="text-white">{user.username}</span>
              </div>
            ) : (
              <div className="hidden rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10 shadow-inner shadow-black/30 sm:block">
                Read-only · sign in to edit
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="icon-button"
                aria-label="User menu"
              >
                <span aria-hidden>👤</span>
                <span className="hidden sm:inline">User</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl menu-surface p-2 text-sm">
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/10"
                    onClick={() => {
                      setMenuOpen(false);
                      openAuth('login');
                    }}
                  >
                    {user ? 'Switch user / log in' : 'Log in'}
                  </button>
                  {user && (
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/10"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                    >
                      Log out
                    </button>
                  )}
                </div>
              )}
            </div>
            <button type="button" onClick={toggleTheme} className="icon-button compact" aria-label={themeLabel}>
              {themeIcon}
              <span className="hidden sm:inline">{themeLabel}</span>
            </button>
          </div>
        </header>

        <Outlet />
        <AuthModal />
      </div>
    </div>
  );
};

export default App;

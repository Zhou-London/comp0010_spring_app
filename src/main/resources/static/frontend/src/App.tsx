import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { MoonIcon, SunIcon } from './components/Icons';

const navigation = [
  { label: 'Home', path: '/' },
  { label: 'Explorer', path: '/explorer' },
  { label: 'Profile', path: '/profile' },
];

const App = () => {
  const preferredTheme = useMemo<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(preferredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const themeIcon = theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />;
  const themeLabel = theme === 'light' ? 'Dark mode' : 'Light mode';

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:py-14">
        <header className="flex items-center justify-between rounded-full bg-white/5 px-6 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700 shadow-inner"></div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">UCL COMP0010</p>
              <p className="text-lg font-semibold">Management Centre</p>
            </div>
          </div>
          <nav className="hidden items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-sm font-medium text-slate-200 shadow-inner shadow-black/30 ring-1 ring-white/10 sm:flex">
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
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10 shadow-inner shadow-black/30 sm:block">
              API password: <span className="text-white">team007</span>
            </div>
            <button type="button" onClick={toggleTheme} className="icon-button" aria-label={themeLabel}>
              {themeIcon}
              <span className="hidden sm:inline">{themeLabel}</span>
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
};

export default App;

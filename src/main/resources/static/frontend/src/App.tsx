import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { label: 'Home', path: '/' },
  { label: 'Students', path: '/students' },
  { label: 'Modules', path: '/modules' },
  { label: 'Grades', path: '/grades' },
  { label: 'Registrations', path: '/registrations' },
  { label: 'Profile', path: '/profile' },
];

const App = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(90,125,255,0.12),transparent_30%),linear-gradient(180deg,#040507_0%,#05060a_60%,#040507_100%)] text-slate-50">
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:py-14">
      <header className="flex items-center justify-between rounded-full bg-white/5 px-6 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700 shadow-inner"></div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">MI5</p>
            <p className="text-lg font-semibold">Information Center</p>
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
        <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10 shadow-inner shadow-black/30">
          API password: <span className="text-white">team007</span>
        </div>
      </header>

      <Outlet />
    </div>
  </div>
);

export default App;

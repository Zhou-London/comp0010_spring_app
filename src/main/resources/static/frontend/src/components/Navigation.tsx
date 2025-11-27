import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview" },
  { to: "/students", label: "Students" },
  { to: "/modules", label: "Modules" },
  { to: "/grades", label: "Grades" },
  { to: "/registrations", label: "Registrations" },
];

export default function Navigation() {
  return (
    <header className="sticky top-4 z-20 mb-8">
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 text-white shadow-lg shadow-slate-500/40">
              <span className="text-lg font-semibold">MI</span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">information</p>
              <h1 className="text-xl font-semibold text-slate-900">Academic Studio</h1>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-sm font-medium text-slate-600">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-500/30"
                      : "hover:bg-slate-900/5"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 rounded-full bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 shadow-inner shadow-white/60">
            <span className="hidden sm:inline">Profile</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-400/40">
              <span className="font-semibold">You</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

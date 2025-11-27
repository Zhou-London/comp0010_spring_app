import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiFetch, unwrapCollection } from '../api';
import { type Grade, type HalCollection, type Module, type Registration, type Student } from '../types';

const spotlightCards = [
  {
    title: 'Students',
    description: 'Create, browse, and celebrate every learner in the registry.',
    to: '/students',
  },
  {
    title: 'Modules',
    description: 'Curate modules with clarity—codes, titles, and whether they are core.',
    to: '/modules',
  },
  {
    title: 'Grades',
    description: 'Capture scores instantly with secure upsert actions.',
    to: '/grades',
  },
  {
    title: 'Registrations',
    description: 'Pair students to modules with one gesture.',
    to: '/registrations',
  },
];

const Home = () => {
  const [stats, setStats] = useState({
    students: 0,
    modules: 0,
    grades: 0,
    registrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentRes, moduleRes, gradeRes, registrationRes] = await Promise.all([
          apiFetch<HalCollection<Student>>('/students'),
          apiFetch<HalCollection<Module>>('/modules'),
          apiFetch<HalCollection<Grade>>('/grades'),
          apiFetch<HalCollection<Registration>>('/registrations'),
        ]);

        setStats({
          students: unwrapCollection(studentRes, 'students').length,
          modules: unwrapCollection(moduleRes, 'modules').length,
          grades: unwrapCollection(gradeRes, 'grades').length,
          registrations: unwrapCollection(registrationRes, 'registrations').length,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-10 p-8 sm:p-10">
        <section className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Spring Boot • React • Tailwind</p>
          <h1 className="text-4xl font-semibold leading-tight text-gradient sm:text-5xl">
            Mission-ready student intelligence,
            <br /> rendered with Apple-like calm.
          </h1>
          <p className="max-w-2xl text-lg text-slate-200/80">
            Manage students, modules, grades, and registrations with graceful controls. All non-GET
            requests need the shared passphrase <span className="text-white">team007</span>—already injected for you.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-200/80">
            <span className="pill">Zero-install UI</span>
            <span className="pill">HAL-friendly API</span>
            <span className="pill">Upsert-ready grades</span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {spotlightCards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group rounded-3xl border border-white/5 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-white/10 hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">{card.title}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{card.title} hub</h2>
                </div>
                <span className="rounded-full bg-white text-slate-900 px-3 py-1 text-xs font-semibold opacity-90 transition group-hover:opacity-100">
                  Go
                </span>
              </div>
              <p className="mt-4 text-slate-200/80">{card.description}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">live snapshot</p>
              <h3 className="text-2xl font-semibold text-white">Campus telemetry</h3>
              <p className="text-slate-200/80">Instant counts from the API; refreshes when you open the page.</p>
            </div>
            {!loading && (
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20">
                Updated now
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[{
              label: 'Students', value: stats.students,
            }, {
              label: 'Modules', value: stats.modules,
            }, {
              label: 'Grades', value: stats.grades,
            }, {
              label: 'Registrations', value: stats.registrations,
            }].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/5 px-4 py-5 shadow-inner shadow-black/40 ring-1 ring-white/10">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{loading ? '…' : item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;

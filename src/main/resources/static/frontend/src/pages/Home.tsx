import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE, apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import {
  type Grade,
  type Module,
  type Registration,
  type Student,
} from '../types';

const spotlightCards = [
  {
    title: 'Students',
    description: 'Searchable, sortable, and fully editable student records.',
    to: '/students',
  },
  {
    title: 'Modules',
    description: 'Filter and browse every module with quick detail access.',
    to: '/modules',
  },
  {
    title: 'APIs',
    description: 'Backend API cheat sheet with the essentials to integrate quickly.',
    to: '/doc-api/',
  },
];

const Home = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const [serverDetail, setServerDetail] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [studentRes, moduleRes, registrationRes, gradeRes] = await Promise.all([
          apiFetch<CollectionResponse<Student>>('/students'),
          apiFetch<CollectionResponse<Module>>('/modules'),
          apiFetch<CollectionResponse<Registration>>('/registrations'),
          apiFetch<CollectionResponse<Grade>>('/grades'),
        ]);

        setStudents(unwrapCollection(studentRes, 'students'));
        setModules(unwrapCollection(moduleRes, 'modules'));
        setRegistrations(unwrapCollection(registrationRes, 'registrations'));
        setGrades(unwrapCollection(gradeRes, 'grades'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const checkServer = async () => {
      try {
        setServerStatus('checking');
        setServerDetail('');
        const response = await fetch(API_BASE, { signal: controller.signal });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `${response.status} ${response.statusText}`);
        }
        setServerStatus('up');
        setServerDetail('Backend reachable');
      } catch (err) {
        setServerStatus('down');
        setServerDetail(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    void checkServer();
    return () => controller.abort();
  }, []);

  const avgGrade = useMemo(() => {
    if (!grades.length) return '–';
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / grades.length).toFixed(1);
  }, [grades]);

  const serverEmoji = serverStatus === 'up' ? '✅' : serverStatus === 'down' ? '⚠️' : '⏳';
  const apiTarget = useMemo(() => new URL(API_BASE, window.location.origin).href, []);
  const serverHelp =
    serverStatus === 'down'
      ? 'Start the Spring Boot service (e.g. ./mvnw spring-boot:run) and confirm it is reachable.'
      : 'Backend is responding normally.';

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-10 p-8 sm:p-10">
        <section className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
            Spring Boot • React • Tailwind
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-gradient sm:text-5xl">
            Mission-ready student intelligence,
            <br /> TEAM 007 Presents
          </h1>
          <p className="max-w-2xl text-lg text-slate-200/80">
            Manage students, modules, grades, and registrations with graceful controls.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-200/80">
            <span className="pill">Zero-install UI</span>
            <span className="pill">HAL-friendly API</span>
            <span className="pill">Upsert-ready grades</span>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30 backdrop-blur-xl ring-1 ring-white/15">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-lg font-semibold text-white">
                <span className="text-xl" aria-hidden>
                  {serverEmoji}
                </span>
                <span>
                  {serverStatus === 'up'
                    ? 'Server is live'
                    : serverStatus === 'down'
                      ? 'Server unreachable'
                      : 'Checking server...'}
                </span>
              </div>
              <div className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
                API target: {apiTarget}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              {serverDetail || serverHelp}
            </p>
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
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">
                    {card.title}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {card.title} hub
                  </h2>
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
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">
                live snapshot
              </p>
              <h3 className="text-2xl font-semibold text-white">
                Campus telemetry
              </h3>
              <p className="text-slate-200/80">
                Instant counts from the API; refreshes when you open the page.
              </p>
            </div>
            {!loading && (
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20">
                Updated now
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Students',
                value: students.length,
              },
              {
                label: 'Modules',
                value: modules.length,
              },
              {
                label: 'Registrations',
                value: registrations.length,
              },
              {
                label: 'Average grade',
                value: avgGrade,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/5 px-4 py-5 shadow-inner shadow-black/40 ring-1 ring-white/10"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {loading ? '…' : item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <ErrorMessage
            message={error}
            title="Home data error"
            tips={[
              'Verify the backend server is running and reachable.',
              'Refresh the dashboard to retry the summary requests.',
              'Sign in again if you think your session expired.',
            ]}
          />
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Students</h2>
                <p className="text-sm text-slate-300">Recent arrivals from the API.</p>
              </div>
              <Link to="/students" className="pill bg-white/10 text-xs text-slate-200">
                Read more
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {students.slice(0, 4).map((student) => (
                <div key={`${student.userName}-${student.email}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{student.userName}</p>
                  <p className="text-lg font-semibold text-white">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-slate-300">{student.email}</p>
                </div>
              ))}
              {!students.length && !loading && <p className="text-slate-300">No students yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Modules</h2>
                <p className="text-sm text-slate-300">Glance at the catalogue and jump into details.</p>
              </div>
              <Link to="/modules" className="pill bg-white/10 text-xs text-slate-200">
                Read more
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {modules.slice(0, 4).map((module) => (
                <div key={`${module.code}-${module.name}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{module.code}</p>
                  <p className="text-lg font-semibold text-white">{module.name}</p>
                  <p className="text-sm text-slate-300">{module.mnc ? 'Mandatory' : 'Elective'}</p>
                </div>
              ))}
              {!modules.length && !loading && <p className="text-slate-300">No modules yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Registrations</h2>
                <p className="text-sm text-slate-300">Connections between students and modules.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {registrations.slice(0, 4).map((registration) => (
                <div
                  key={`${registration.id ?? `${registration.student?.userName}-${registration.module?.code}`}`}
                  className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10"
                >
                  <p className="text-sm text-slate-200">
                    {registration.student?.userName ?? 'Unknown student'} → {registration.module?.code ?? 'Unknown module'}
                  </p>
                </div>
              ))}
              {!registrations.length && !loading && <p className="text-slate-300">No registrations yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Grades</h2>
                <p className="text-sm text-slate-300">Latest marks with their module context.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {grades.slice(0, 4).map((grade, index) => (
                <div key={`${grade.id ?? index}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="text-sm text-slate-200">
                    {grade.student?.userName ?? 'Unknown'} · {grade.module?.code ?? 'Module'}
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-1 text-xs text-white ring-1 ring-white/10">{grade.score ?? '—'}</span>
                  </p>
                </div>
              ))}
              {!grades.length && !loading && <p className="text-slate-300">No grades recorded.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;

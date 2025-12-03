import { useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { type Grade, type Module, type Registration, type Student } from '../types';

const Api = () => {
  const { user, openAuth } = useAuth();
  const [meta, setMeta] = useState({
    students: 0,
    modules: 0,
    grades: 0,
    registrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [students, modules, grades, registrations] = await Promise.all([
          apiFetch<CollectionResponse<Student>>('/students'),
          apiFetch<CollectionResponse<Module>>('/modules'),
          apiFetch<CollectionResponse<Grade>>('/grades'),
          apiFetch<CollectionResponse<Registration>>('/registrations'),
        ]);

        setMeta({
          students: unwrapCollection(students, 'students').length,
          modules: unwrapCollection(modules, 'modules').length,
          grades: unwrapCollection(grades, 'grades').length,
          registrations: unwrapCollection(registrations, 'registrations').length,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, []);

  const endpointSummary = useMemo(() => [
    { method: 'GET', path: '/students', description: 'HAL collection of student records.' },
    { method: 'POST', path: '/students', description: 'Create a student (requires login).' },
    { method: 'GET', path: '/modules', description: 'Course catalogue with mnc flag.' },
    { method: 'POST', path: '/modules', description: 'Create or update modules (requires login).' },
    { method: 'GET', path: '/registrations', description: 'Student-module bindings.' },
    { method: 'POST', path: '/registrations', description: 'Create registrations with studentId + moduleId (requires login).' },
    { method: 'GET', path: '/grades', description: 'Recorded grades including relationships.' },
    { method: 'POST', path: '/grades/upsert', description: 'Upsert grade using studentId + moduleId + score (requires login).' },
  ], []);

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">API</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Backend tokens & endpoints</h1>
          <p className="text-slate-200/80">
            Authenticate once to unlock create, update, and delete operations. Your current bearer token is displayed below
            for use in API tools.
          </p>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">Live collections</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Current counts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[{ label: 'Students', value: meta.students }, { label: 'Modules', value: meta.modules }, { label: 'Grades', value: meta.grades }, { label: 'Registrations', value: meta.registrations }].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/5 px-4 py-4 ring-1 ring-white/10">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{loading ? '…' : item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">Access token</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Bearer authentication</h2>
            </div>
            <button type="button" className="icon-button text-xs" onClick={() => openAuth('login')}>
              {user ? 'Refresh token' : 'Log in to get a token'}
            </button>
          </div>
          <p className="mt-2 rounded-2xl bg-black/40 px-4 py-3 font-mono text-sm text-slate-100 ring-1 ring-white/10">
            {user ? user.token : 'Sign in to view your token'}
          </p>
          <p className="mt-2 text-xs text-slate-300">Send requests with <code className="rounded bg-white/10 px-1">Authorization: Bearer &lt;token&gt;</code>.</p>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">Endpoints</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Common requests</h2>
          <div className="mt-4 space-y-2">
            {endpointSummary.map((endpoint) => (
              <div
                key={endpoint.path + endpoint.method}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200">{endpoint.method}</p>
                  <p className="text-sm text-white">{endpoint.path}</p>
                  <p className="text-xs text-slate-300">{endpoint.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Api;

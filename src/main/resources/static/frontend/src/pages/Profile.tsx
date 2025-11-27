import { useEffect, useState } from 'react';
import { apiFetch, unwrapCollection } from '../api';
import { type Grade, type HalCollection, type Module, type Registration, type Student } from '../types';

const Profile = () => {
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
          apiFetch<HalCollection<Student>>('/students'),
          apiFetch<HalCollection<Module>>('/modules'),
          apiFetch<HalCollection<Grade>>('/grades'),
          apiFetch<HalCollection<Registration>>('/registrations'),
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

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Profile</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">API readiness</h1>
          <p className="text-slate-200/80">Everything you need to work with this Spring Data REST backend at a glance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">Guidance</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Authentication</h2>
            <p className="mt-3 text-slate-200/80">
              All non-GET requests must include <code className="rounded bg-white/10 px-1">"password": "team007"</code> in the JSON body.
              The UI already injects this secret for you.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">POST /students</p>
              <p className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">POST /modules</p>
              <p className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">POST /registrations</p>
              <p className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">POST /grades/upsert</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">System pulse</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Live collections</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[{
                label: 'Students', value: meta.students,
              }, {
                label: 'Modules', value: meta.modules,
              }, {
                label: 'Grades', value: meta.grades,
              }, {
                label: 'Registrations', value: meta.registrations,
              }].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/5 px-4 py-4 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{loading ? '…' : item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-200/80">Counts reflect the HAL collections from the backend right now.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300/80">Shortcuts</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Useful endpoints</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-200">
            <div className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">GET /students/{'{id}'}/average</div>
            <div className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">GET /modules/search/findByCode?code=COMP0010</div>
            <div className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">GET /registrations/search/findAllByStudent?studentId=1</div>
            <div className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">GET /grades/search/findAllByModule?moduleId=1</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

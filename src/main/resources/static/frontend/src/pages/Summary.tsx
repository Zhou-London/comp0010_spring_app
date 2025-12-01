import { useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade, type Module, type Registration, type Student } from '../types';

const Summary = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [studentsResponse, modulesResponse, registrationsResponse, gradesResponse] = await Promise.all([
          apiFetch<CollectionResponse<Student>>('/students'),
          apiFetch<CollectionResponse<Module>>('/modules'),
          apiFetch<CollectionResponse<Registration>>('/registrations'),
          apiFetch<CollectionResponse<Grade>>('/grades'),
        ]);

        setStudents(unwrapCollection(studentsResponse, 'students'));
        setModules(unwrapCollection(modulesResponse, 'modules'));
        setRegistrations(unwrapCollection(registrationsResponse, 'registrations'));
        setGrades(unwrapCollection(gradesResponse, 'grades'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load summary data');
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, []);

  const avgGrade = useMemo(() => {
    if (!grades.length) return '–';
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / grades.length).toFixed(1);
  }, [grades]);

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Summary</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Everything at a glance</h1>
          <p className="text-slate-200/80">
            A single place to review students, modules, registrations, and grades without touching any modification controls.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Students</p>
            <p className="text-3xl font-semibold text-white">{students.length}</p>
            <p className="text-sm text-slate-300">Active profiles</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Modules</p>
            <p className="text-3xl font-semibold text-white">{modules.length}</p>
            <p className="text-sm text-slate-300">Course catalogue</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Registrations</p>
            <p className="text-3xl font-semibold text-white">{registrations.length}</p>
            <p className="text-sm text-slate-300">Active enrolments</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Average grade</p>
            <p className="text-3xl font-semibold text-white">{avgGrade}</p>
            <p className="text-sm text-slate-300">Across recorded marks</p>
          </div>
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}
        {loading && <p className="text-slate-300">Loading consolidated view…</p>}

        {!loading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Student directory</h2>
                <span className="pill bg-white/10 text-xs text-slate-200">Read-only</span>
              </div>
              <div className="mt-4 space-y-3">
                {students.map((student) => (
                  <div key={`${student.userName}-${student.email}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{student.userName}</p>
                    <p className="text-lg font-semibold text-white">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-slate-300">{student.email}</p>
                  </div>
                ))}
                {!students.length && <p className="text-slate-300">No students yet.</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Module catalogue</h2>
                <span className="pill bg-white/10 text-xs text-slate-200">Read-only</span>
              </div>
              <div className="mt-4 space-y-3">
                {modules.map((module) => (
                  <div key={`${module.code}-${module.name}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{module.code}</p>
                    <p className="text-lg font-semibold text-white">{module.name}</p>
                    <p className="text-sm text-slate-300">{module.mnc ? 'Mandatory' : 'Elective'}</p>
                  </div>
                ))}
                {!modules.length && <p className="text-slate-300">No modules yet.</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Registrations</h2>
                <span className="pill bg-white/10 text-xs text-slate-200">Read-only</span>
              </div>
              <div className="mt-4 space-y-3">
                {registrations.map((registration) => (
                  <div key={`${registration.id ?? `${registration.student?.userName}-${registration.module?.code}`}`}
                       className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                    <p className="text-sm text-slate-200">{registration.student?.userName ?? 'Unknown student'} → {registration.module?.code ?? 'Unknown module'}</p>
                  </div>
                ))}
                {!registrations.length && <p className="text-slate-300">No registrations yet.</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Grades</h2>
                <span className="pill bg-white/10 text-xs text-slate-200">Read-only</span>
              </div>
              <div className="mt-4 space-y-3">
                {grades.map((grade, index) => (
                  <div key={`${grade.id ?? index}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                    <p className="text-sm text-slate-200">{grade.student?.userName ?? 'Unknown'} · {grade.module?.code ?? 'Module'}
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-1 text-xs text-white ring-1 ring-white/10">{grade.score ?? '—'}</span>
                    </p>
                  </div>
                ))}
                {!grades.length && <p className="text-slate-300">No grades recorded.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;

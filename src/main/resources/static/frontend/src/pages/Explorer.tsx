import { useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade, type Module, type Registration, type Student } from '../types';

const Explorer = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [moduleQuery, setModuleQuery] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
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
    };

    void fetchAll();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return fullName.includes(query) || student.userName.toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
    });
  }, [studentQuery, students]);

  const filteredModules = useMemo(() => {
    const query = moduleQuery.trim().toLowerCase();
    if (!query) return modules;
    return modules.filter((module) => module.code.toLowerCase().includes(query) || module.name.toLowerCase().includes(query));
  }, [moduleQuery, modules]);

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Explorer</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Read-only data explorer</h1>
          <p className="text-slate-200/80">Search and browse records without risk of changing them.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Students</h2>
                <p className="text-sm text-slate-300">Filter by name, username, or email.</p>
              </div>
              <div className="pill bg-white/10 text-xs text-slate-200">Read-only</div>
            </div>
            <input
              className="field mt-4"
              placeholder="Search students..."
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
            />
            <div className="mt-4 space-y-3 max-h-[30rem] overflow-auto pr-2">
              {filteredStudents.map((student) => (
                <div key={`${student.userName}-${student.email}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{student.userName}</p>
                  <p className="text-lg font-semibold text-white">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-slate-300">{student.email}</p>
                </div>
              ))}
              {!filteredStudents.length && <p className="text-slate-300">No students matched your search.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Modules</h2>
                <p className="text-sm text-slate-300">Look up modules and check whether they are mandatory.</p>
              </div>
              <div className="pill bg-white/10 text-xs text-slate-200">Read-only</div>
            </div>
            <input
              className="field mt-4"
              placeholder="Search modules..."
              value={moduleQuery}
              onChange={(e) => setModuleQuery(e.target.value)}
            />
            <div className="mt-4 space-y-3 max-h-[30rem] overflow-auto pr-2">
              {filteredModules.map((module) => (
                <div key={`${module.code}-${module.name}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{module.code}</p>
                  <p className="text-lg font-semibold text-white">{module.name}</p>
                  <p className="text-sm text-slate-300">{module.mnc ? 'Mandatory' : 'Elective'}</p>
                </div>
              ))}
              {!filteredModules.length && <p className="text-slate-300">No modules matched your search.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Registrations</h2>
              <div className="pill bg-white/10 text-xs text-slate-200">Read-only</div>
            </div>
            <div className="mt-4 space-y-3 max-h-[24rem] overflow-auto pr-2">
              {registrations.map((registration) => (
                <div key={`${registration.id ?? `${registration.student?.userName}-${registration.module?.code}`}`}
                     className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="text-sm text-slate-200">{registration.student?.userName ?? 'Unknown student'} → {registration.module?.code ?? 'Unknown module'}</p>
                </div>
              ))}
              {!registrations.length && <p className="text-slate-300">No registrations found.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Grades</h2>
              <div className="pill bg-white/10 text-xs text-slate-200">Read-only</div>
            </div>
            <div className="mt-4 space-y-3 max-h-[24rem] overflow-auto pr-2">
              {grades.map((grade, index) => (
                <div key={`${grade.id ?? index}`} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="text-sm text-slate-200">{grade.student?.userName ?? 'Unknown'} · {grade.module?.code ?? 'Module'}
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-1 text-xs text-white ring-1 ring-white/10">{grade.score ?? '—'}</span>
                  </p>
                </div>
              ))}
              {!grades.length && <p className="text-slate-300">No grades available.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explorer;

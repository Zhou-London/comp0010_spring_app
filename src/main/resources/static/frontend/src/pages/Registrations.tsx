import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import { type Module, type Registration, type Student } from '../types';

const emptyForm = {
  studentId: '',
  moduleId: '',
};

type AppContext = {
  refreshOps: () => void;
};

const Registrations = () => {
  const { refreshOps } = useOutletContext() as AppContext;
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [studentQuery, setStudentQuery] = useState('');
  const [moduleQuery, setModuleQuery] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');
  const [studentSuggestionsOpen, setStudentSuggestionsOpen] = useState(false);
  const [moduleSuggestionsOpen, setModuleSuggestionsOpen] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const response = await apiFetch<CollectionResponse<Student>>('/students');
      setStudents(unwrapCollection(response, 'students'));
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchModules = async () => {
    setModulesLoading(true);
    try {
      const response = await apiFetch<CollectionResponse<Module>>('/modules');
      setModules(unwrapCollection(response, 'modules'));
    } finally {
      setModulesLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<CollectionResponse<Registration>>('/registrations');
      setRegistrations(unwrapCollection(response, 'registrations'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    void fetchStudents();
    void fetchModules();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    if (!form.studentId || !form.moduleId) {
      setError('Select a student and module before saving.');
      setSubmitting(false);
      return;
    }

    try {
      await apiFetch('/registrations', {
        method: 'POST',
        body: {
          studentId: Number(form.studentId),
          moduleId: Number(form.moduleId),
        },
      });
      setForm(emptyForm);
      setMessage('Registration saved successfully.');
      await fetchRegistrations();
      refreshOps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save registration');
    } finally {
      setSubmitting(false);
    }
  };

  const total = useMemo(() => registrations.length, [registrations]);

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        student.userName.toLowerCase().includes(query) ||
        student.id?.toString().includes(query)
      );
    });
  }, [studentQuery, students]);

  const suggestionsStudents = useMemo(() => {
    const query = studentSearchTerm.trim().toLowerCase();
    if (!query) return [];
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        student.userName.toLowerCase().includes(query) ||
        student.id?.toString().includes(query)
      );
    });
  }, [studentSearchTerm, students]);

  const filteredModules = useMemo(() => {
    const query = moduleQuery.trim().toLowerCase();
    if (!query) return modules;
    return modules.filter((module) => {
      return (
        module.code.toLowerCase().includes(query) ||
        module.name.toLowerCase().includes(query) ||
        module.id?.toString().includes(query)
      );
    });
  }, [moduleQuery, modules]);

  const suggestionsModules = useMemo(() => {
    const query = moduleSearchTerm.trim().toLowerCase();
    if (!query) return [];
    return modules.filter((module) => {
      return (
        module.code.toLowerCase().includes(query) ||
        module.name.toLowerCase().includes(query) ||
        module.id?.toString().includes(query)
      );
    });
  }, [moduleSearchTerm, modules]);

  const handleStudentSelect = (student: Student) => {
    setForm((current) => ({ ...current, studentId: student.id?.toString() ?? '' }));
    setMessage(`Selected ${student.userName} for enrollment.`);
  };

  const handleModuleSelect = (module: Module) => {
    setForm((current) => ({ ...current, moduleId: module.id?.toString() ?? '' }));
    setMessage(`Selected module ${module.code}.`);
  };

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Registrations</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Enrollments</h1>
          <p className="text-slate-200/80">Bind students to modules with a single submission.</p>
          <div className="pill inline-flex w-fit items-center gap-2 bg-white/10 text-xs font-semibold text-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-purple-300"></span>
            {total} active registrations
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white">Register a student</h2>
            <p className="text-sm text-slate-300">Choose a student and module from the lists or enter IDs manually.</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
              <div className="flex-1 space-y-1 text-sm text-slate-200">
                <p className="font-semibold text-white">Selection</p>
                <p>Student: {form.studentId ? `#${form.studentId}` : 'None selected'}</p>
                <p>Module: {form.moduleId ? `#${form.moduleId}` : 'None selected'}</p>
              </div>
              <button
                type="button"
                onClick={() => setManualEntryVisible((current) => !current)}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 ring-1 ring-white/20 transition hover:bg-white/20"
              >
                {manualEntryVisible ? 'Hide manual entry' : 'Enter IDs manually'}
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative space-y-2">
                  <label className="text-sm text-slate-200" htmlFor="studentSearch">Find student</label>
                  <input
                    id="studentSearch"
                    value={studentSearchTerm}
                    onFocus={() => setStudentSuggestionsOpen(true)}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value);
                      setStudentSuggestionsOpen(true);
                    }}
                    className="field"
                    placeholder="Type name, username, or ID"
                  />
                  {studentSuggestionsOpen && suggestionsStudents.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-2xl border border-white/15 bg-black/60 p-2 shadow-lg backdrop-blur">
                      {suggestionsStudents.map((student) => (
                        <button
                          key={`suggest-${student.id ?? student.userName}`}
                          type="button"
                          onClick={() => {
                            setForm((current) => ({ ...current, studentId: student.id?.toString() ?? '' }));
                            setStudentSearchTerm(`${student.firstName} ${student.lastName}`);
                            setStudentQuery(''); // collapse suggestion list
                            setStudentSuggestionsOpen(false);
                          }}
                          className="flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left hover:bg-white/10"
                        >
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-300">ID: {student.id ?? '–'}</span>
                          <span className="text-sm font-semibold text-white">{student.firstName} {student.lastName}</span>
                          <span className="text-xs text-slate-300">{student.userName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative space-y-2">
                  <label className="text-sm text-slate-200" htmlFor="moduleSearch">Find module</label>
                  <input
                    id="moduleSearch"
                    value={moduleSearchTerm}
                    onFocus={() => setModuleSuggestionsOpen(true)}
                    onChange={(e) => {
                      setModuleSearchTerm(e.target.value);
                      setModuleSuggestionsOpen(true);
                    }}
                    className="field"
                    placeholder="Type code, name, or ID"
                  />
                  {moduleSuggestionsOpen && suggestionsModules.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-2xl border border-white/15 bg-black/60 p-2 shadow-lg backdrop-blur">
                      {suggestionsModules.map((module) => (
                        <button
                          key={`suggest-${module.id ?? module.code}`}
                          type="button"
                          onClick={() => {
                            setForm((current) => ({ ...current, moduleId: module.id?.toString() ?? '' }));
                            setModuleSearchTerm(module.code);
                            setModuleQuery(''); // collapse suggestion list
                            setModuleSuggestionsOpen(false);
                          }}
                          className="flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left hover:bg-white/10"
                        >
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-300">ID: {module.id ?? '–'}</span>
                          <span className="text-sm font-semibold text-white">{module.code}</span>
                          <span className="text-xs text-slate-300">{module.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {manualEntryVisible && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="studentId">Student ID</label>
                    <input
                      id="studentId"
                      value={form.studentId}
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                      className="field"
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="moduleId">Module ID</label>
                    <input
                      id="moduleId"
                      value={form.moduleId}
                      onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                      className="field"
                      placeholder="1"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-white/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : 'Save registration'}
              </button>
              {message && <p className="text-sm text-emerald-300">{message}</p>}
          {error && (
            <ErrorMessage
              message={error}
              title="Registration error"
              tips={[
                'Pick both a student and module before saving.',
                'Confirm the selected records still exist and are visible.',
                'Retry after a refresh if the session may have expired.',
              ]}
              floating
            />
          )}
            </form>

            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Students</h3>
                  <input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search by name or ID"
                    className="field w-48 sm:w-56"
                  />
                </div>
                <div className="grid max-h-64 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {studentsLoading ? (
                    <p className="text-slate-300">Loading students…</p>
                  ) : filteredStudents.length ? (
                    filteredStudents.map((student) => {
                      const isSelected = form.studentId === (student.id?.toString() ?? '');
                      return (
                        <button
                          key={`${student.userName}-${student.email}`}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className={`rounded-2xl px-4 py-3 text-left ring-1 shadow-sm transition ${
                            isSelected
                              ? 'bg-emerald-500/20 ring-emerald-300 shadow-emerald-500/40'
                              : 'bg-black/30 ring-white/10 shadow-black/40 hover:ring-white/20'
                          }`}
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80">ID: {student.id ?? '–'}</p>
                          <p className="text-sm font-semibold text-white">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-slate-300">{student.userName}</p>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-slate-300">No students match that search.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Modules</h3>
                  <input
                    value={moduleQuery}
                    onChange={(e) => setModuleQuery(e.target.value)}
                    placeholder="Search by code or ID"
                    className="field w-48 sm:w-56"
                  />
                </div>
                <div className="grid max-h-64 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {modulesLoading ? (
                    <p className="text-slate-300">Loading modules…</p>
                  ) : filteredModules.length ? (
                    filteredModules.map((module) => {
                      const isSelected = form.moduleId === (module.id?.toString() ?? '');
                      return (
                        <button
                          key={`${module.code}-${module.name}`}
                          type="button"
                          onClick={() => handleModuleSelect(module)}
                          className={`rounded-2xl px-4 py-3 text-left ring-1 shadow-sm transition ${
                            isSelected
                              ? 'bg-sky-500/20 ring-sky-300 shadow-sky-500/40'
                              : 'bg-black/30 ring-white/10 shadow-black/40 hover:ring-white/20'
                          }`}
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80">ID: {module.id ?? '–'}</p>
                          <p className="text-sm font-semibold text-white">{module.code}</p>
                          <p className="text-sm text-slate-300">{module.name}</p>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-slate-300">No modules match that search.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Existing</h2>
              <button
                type="button"
                onClick={fetchRegistrations}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="mt-4 text-slate-300">Loading registrations…</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {registrations.map((registration) => (
                  <div
                    key={`${registration.id ?? ''}-${registration.student?.userName ?? registration.student?.id ?? ''}-${registration.module?.code ?? registration.module?.id ?? ''}`}
                    className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10 shadow-sm shadow-black/40"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{registration.module?.code ?? 'Module'}</p>
                    <p className="text-lg font-semibold text-white">{registration.module?.name ?? 'Module name'}</p>
                    <p className="text-sm text-slate-300">Student: {registration.student?.userName ?? registration.student?.id ?? 'Unknown'}</p>
                  </div>
                ))}
                {registrations.length === 0 && (
                  <p className="text-slate-300">No registrations yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registrations;
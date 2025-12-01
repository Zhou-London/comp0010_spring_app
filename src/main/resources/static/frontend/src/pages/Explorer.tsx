import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade, type Module, type Student } from '../types';

const emptyStudent: Student = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
};

const emptyModule: Module = {
  code: '',
  name: '',
  mnc: false,
};

const Explorer = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [studentQuery, setStudentQuery] = useState('');
  const [moduleQuery, setModuleQuery] = useState('');

  const [studentSort, setStudentSort] = useState<'nameAsc' | 'nameDesc' | 'id'>('nameAsc');
  const [moduleSort, setModuleSort] = useState<'codeAsc' | 'codeDesc' | 'nameAsc'>('codeAsc');

  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [studentForm, setStudentForm] = useState<Student>(emptyStudent);
  const [moduleForm, setModuleForm] = useState<Module>(emptyModule);
  const [submitting, setSubmitting] = useState(false);
  const [savingError, setSavingError] = useState('');
  const [savingMessage, setSavingMessage] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsResponse, modulesResponse, gradesResponse] = await Promise.all([
        apiFetch<CollectionResponse<Student>>('/students'),
        apiFetch<CollectionResponse<Module>>('/modules'),
        apiFetch<CollectionResponse<Grade>>('/grades'),
      ]);

      setStudents(unwrapCollection(studentsResponse, 'students'));
      setModules(unwrapCollection(modulesResponse, 'modules'));
      setGrades(unwrapCollection(gradesResponse, 'grades'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load explorer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const studentAverages = useMemo(() => {
    const totals = new Map<number, { sum: number; count: number }>();
    grades.forEach((grade) => {
      const studentId = grade.student?.id;
      if (!studentId || grade.score == null) return;
      const current = totals.get(studentId) ?? { sum: 0, count: 0 };
      totals.set(studentId, { sum: current.sum + grade.score, count: current.count + 1 });
    });
    return totals;
  }, [grades]);

  const moduleAverages = useMemo(() => {
    const totals = new Map<number, { sum: number; count: number }>();
    grades.forEach((grade) => {
      const moduleId = grade.module?.id;
      if (!moduleId || grade.score == null) return;
      const current = totals.get(moduleId) ?? { sum: 0, count: 0 };
      totals.set(moduleId, { sum: current.sum + grade.score, count: current.count + 1 });
    });
    return totals;
  }, [grades]);

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    const sorted = [...students].sort((a, b) => {
      if (studentSort === 'id') return (a.id ?? 0) - (b.id ?? 0);
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return studentSort === 'nameAsc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    if (!query) return sorted;
    return sorted.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return fullName.includes(query) || student.userName.toLowerCase().includes(query) || `${student.id ?? ''}`.includes(query);
    });
  }, [studentQuery, students, studentSort]);

  const filteredModules = useMemo(() => {
    const query = moduleQuery.trim().toLowerCase();
    const sorted = [...modules].sort((a, b) => {
      if (moduleSort === 'nameAsc') return a.name.localeCompare(b.name);
      if (moduleSort === 'codeDesc') return b.code.localeCompare(a.code);
      return a.code.localeCompare(b.code);
    });

    if (!query) return sorted;
    return sorted.filter((module) => module.code.toLowerCase().includes(query) || module.name.toLowerCase().includes(query));
  }, [moduleQuery, modules, moduleSort]);

  const openStudentModal = () => {
    setStudentForm(emptyStudent);
    setSavingError('');
    setSavingMessage('');
    setStudentFormOpen(true);
  };

  const openModuleModal = () => {
    setModuleForm(emptyModule);
    setSavingError('');
    setSavingMessage('');
    setModuleFormOpen(true);
  };

  const handleSaveStudent = async () => {
    setSubmitting(true);
    setSavingError('');
    setSavingMessage('');
    try {
      await apiFetch('/students', { method: 'POST', body: studentForm });
      setSavingMessage('Student created.');
      setStudentFormOpen(false);
      setStudentForm(emptyStudent);
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveModule = async () => {
    setSubmitting(true);
    setSavingError('');
    setSavingMessage('');
    try {
      await apiFetch('/modules', { method: 'POST', body: moduleForm });
      setSavingMessage('Module created.');
      setModuleFormOpen(false);
      setModuleForm(emptyModule);
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStudentCard = (student: Student) => {
    const stats = student.id ? studentAverages.get(student.id) : undefined;
    const average = stats ? (stats.sum / stats.count).toFixed(1) : '–';

    return (
      <button
        key={`${student.userName}-${student.email}`}
        type="button"
        onClick={() => student.id && navigate(`/students/${student.id}`)}
        className="surface-card explorer-card group flex h-full flex-col gap-3 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">{student.userName}</p>
          <span className="pill">ID: {student.id ?? '–'}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-semibold text-white">{student.firstName} {student.lastName}</p>
          <p className="text-sm text-slate-300">Average score · {average}</p>
        </div>
      </button>
    );
  };

  const renderModuleCard = (module: Module) => {
    const stats = module.id ? moduleAverages.get(module.id) : undefined;
    const average = stats ? (stats.sum / stats.count).toFixed(1) : '–';

    return (
      <button
        key={`${module.code}-${module.name}`}
        type="button"
        onClick={() => module.id && navigate(`/modules/${module.id}`)}
        className="surface-card explorer-card group flex h-full flex-col gap-3 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">{module.code}</p>
          <span className="pill">ID: {module.id ?? '–'}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-semibold text-white">{module.name}</p>
          <p className="text-sm text-slate-300">Average grade · {average}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="glass-panel" id="explorer">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Explorer</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Search, sort, and open records</h1>
          <p className="text-slate-200/80">
            Browse students and modules in scrollable lists. Use search and sorting controls, add new entries, and click any card to open its detailed page.
          </p>
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Students</h2>
                <p className="text-sm text-slate-300">Searchable, sortable student directory.</p>
              </div>
              <button
                type="button"
                onClick={openStudentModal}
                className="icon-button accent text-xs"
                aria-label="Add student"
              >
                <span aria-hidden>➕</span>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                className="field flex-1 min-w-[12rem]"
                placeholder="Search by name or ID"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
              />
              <select
                value={studentSort}
                onChange={(e) => setStudentSort(e.target.value as typeof studentSort)}
                className="rounded-full bg-black/40 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10"
              >
                <option value="nameAsc">Name: A to Z</option>
                <option value="nameDesc">Name: Z to A</option>
                <option value="id">Student ID</option>
              </select>
            </div>
            <div className="mt-4 grid max-h-[32rem] gap-3 overflow-auto pr-2 explorer-grid">
              {filteredStudents.map(renderStudentCard)}
              {!loading && !filteredStudents.length && <p className="text-slate-300">No students match that search.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Modules</h2>
                <p className="text-sm text-slate-300">Scroll, search, and open module records.</p>
              </div>
              <button
                type="button"
                onClick={openModuleModal}
                className="icon-button accent text-xs"
                aria-label="Add module"
              >
                <span aria-hidden>➕</span>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                className="field flex-1 min-w-[12rem]"
                placeholder="Search by code or name"
                value={moduleQuery}
                onChange={(e) => setModuleQuery(e.target.value)}
              />
              <select
                value={moduleSort}
                onChange={(e) => setModuleSort(e.target.value as typeof moduleSort)}
                className="rounded-full bg-black/40 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10"
              >
                <option value="codeAsc">Code: A to Z</option>
                <option value="codeDesc">Code: Z to A</option>
                <option value="nameAsc">Name: A to Z</option>
              </select>
            </div>
            <div className="mt-4 grid max-h-[32rem] gap-3 overflow-auto pr-2 explorer-grid">
              {filteredModules.map(renderModuleCard)}
              {!loading && !filteredModules.length && <p className="text-slate-300">No modules match that search.</p>}
            </div>
          </div>
        </div>

        {(studentFormOpen || moduleFormOpen) && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4 py-6">
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl ring-1 ring-white/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Create</p>
                  <h3 className="text-xl font-semibold text-white">{studentFormOpen ? 'Add a student' : 'Add a module'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStudentFormOpen(false);
                    setModuleFormOpen(false);
                  }}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/20"
                >
                  Close
                </button>
              </div>

              {savingMessage && <p className="mt-2 text-sm text-emerald-300">{savingMessage}</p>}
              {savingError && <p className="mt-2 text-sm text-rose-300">{savingError}</p>}

              {studentFormOpen && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                      className="field"
                      placeholder="Ada"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                      className="field"
                      placeholder="Lovelace"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="userName">Username</label>
                    <input
                      id="userName"
                      value={studentForm.userName}
                      onChange={(e) => setStudentForm({ ...studentForm, userName: e.target.value })}
                      className="field"
                      placeholder="ada.l"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="field"
                      placeholder="ada@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSaveStudent}
                      disabled={submitting}
                      className="icon-button accent"
                      aria-label="Save student"
                    >
                      <span aria-hidden>💾</span>
                      <span className="sr-only">Save student</span>
                    </button>
                  </div>
                </div>
              )}

              {moduleFormOpen && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="code">Module code</label>
                    <input
                      id="code"
                      value={moduleForm.code}
                      onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
                      className="field"
                      placeholder="COMP0010"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="name">Module name</label>
                    <input
                      id="name"
                      value={moduleForm.name}
                      onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                      className="field"
                      placeholder="Software Engineering"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-slate-200" htmlFor="mnc">Mandatory</label>
                    <div className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">
                      <input
                        id="mnc"
                        type="checkbox"
                        checked={moduleForm.mnc}
                        onChange={(e) => setModuleForm({ ...moduleForm, mnc: e.target.checked })}
                        className="h-5 w-5 rounded border-white/30 bg-white/10 text-sky-400 focus:ring-white/40"
                      />
                      <span className="text-slate-200">Toggle if this module is mandatory.</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSaveModule}
                      disabled={submitting}
                      className="icon-button accent"
                      aria-label="Save module"
                    >
                      <span aria-hidden>💾</span>
                      <span className="sr-only">Save module</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;

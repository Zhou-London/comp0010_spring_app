import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade, type Module, type Student } from '../types';

const emptyForm = {
  studentId: '',
  moduleId: '',
  score: '',
};

const Grades = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
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
  const [sortBy, setSortBy] = useState<'scoreDesc' | 'scoreAsc' | 'nameAsc' | 'nameDesc'>('scoreDesc');
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

  const fetchGrades = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<CollectionResponse<Grade>>('/grades');
      setGrades(unwrapCollection(response, 'grades'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
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
      await apiFetch('/grades/upsert', {
        method: 'POST',
        body: {
          studentId: Number(form.studentId),
          moduleId: Number(form.moduleId),
          score: Number(form.score),
        },
      });
      setForm(emptyForm);
      setMessage('Grade upserted successfully.');
      await fetchGrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upsert grade');
    } finally {
      setSubmitting(false);
    }
  };

  const averageScore = useMemo(() => {
    if (!grades.length) return 0;
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return Math.round((total / grades.length) * 10) / 10;
  }, [grades]);

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

  const sortedGrades = useMemo(() => {
    const copy = [...grades];
    switch (sortBy) {
      case 'scoreAsc':
        return copy.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
      case 'nameAsc':
        return copy.sort((a, b) => {
          const nameA = a.student?.userName ?? '';
          const nameB = b.student?.userName ?? '';
          return nameA.localeCompare(nameB);
        });
      case 'nameDesc':
        return copy.sort((a, b) => {
          const nameA = a.student?.userName ?? '';
          const nameB = b.student?.userName ?? '';
          return nameB.localeCompare(nameA);
        });
      case 'scoreDesc':
      default:
        return copy.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
  }, [grades, sortBy]);

  const handleStudentSelect = (student: Student) => {
    setForm((current) => ({ ...current, studentId: student.id?.toString() ?? '' }));
    setMessage(`Selected ${student.userName} for grading.`);
  };

  const handleModuleSelect = (module: Module) => {
    setForm((current) => ({ ...current, moduleId: module.id?.toString() ?? '' }));
    setMessage(`Selected module ${module.code}.`);
  };

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Grades</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Scores and outcomes</h1>
          <p className="text-slate-200/80">Upsert grades using student + module identifiers. Password handled for you.</p>
          <div className="pill inline-flex w-fit items-center gap-2 bg-white/10 text-xs font-semibold text-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-300"></span>
            Avg score: {grades.length ? averageScore : '–'}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white">Upsert a grade</h2>
            <p className="text-sm text-slate-300">Pick a student and module from the lists or enter IDs manually, then supply a score.</p>

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

              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="score">Score</label>
                <input
                  id="score"
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  required
                  className="field"
                  placeholder="95"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-white/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : 'Upsert grade'}
              </button>
              {message && <p className="text-sm text-emerald-300">{message}</p>}
              {error && <p className="text-sm text-rose-300">{error}</p>}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Recorded grades</h2>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-slate-200" htmlFor="sortBy">
                  Sort by
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 focus:outline-none focus:ring-white/40"
                >
                  <option value="scoreDesc">Score: high to low</option>
                  <option value="scoreAsc">Score: low to high</option>
                  <option value="nameAsc">Student: A to Z</option>
                  <option value="nameDesc">Student: Z to A</option>
                </select>
                <button
                  type="button"
                  onClick={fetchGrades}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 transition hover:bg-white/20"
                >
                  Refresh
                </button>
              </div>
            </div>
            {loading ? (
              <p className="mt-4 text-slate-300">Loading grades…</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {sortedGrades.map((grade) => (
                  <div
                    key={`${grade.id ?? ''}-${grade.student?.userName ?? grade.student?.id ?? ''}-${grade.module?.code ?? grade.module?.id ?? ''}`}
                    className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10 shadow-sm shadow-black/40"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{grade.module?.code ?? 'Module'}</p>
                    <p className="text-lg font-semibold text-white">Score: {grade.score}</p>
                    <p className="text-sm text-slate-300">Student: {grade.student?.userName ?? grade.student?.id ?? 'Unknown'}</p>
                  </div>
                ))}
                {grades.length === 0 && (
                  <p className="text-slate-300">No grades recorded yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grades;

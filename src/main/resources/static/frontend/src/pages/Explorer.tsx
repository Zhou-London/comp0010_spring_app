import { useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade, type Module, type Registration, type Student } from '../types';

interface RegistrationFormState {
  id?: number;
  studentId: string;
  moduleId: string;
}

interface GradeFormState {
  id?: number;
  studentId: string;
  moduleId: string;
  score: string;
}

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

const emptyRegistration: RegistrationFormState = {
  studentId: '',
  moduleId: '',
};

const emptyGrade: GradeFormState = {
  studentId: '',
  moduleId: '',
  score: '',
};

const Explorer = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [studentQuery, setStudentQuery] = useState('');
  const [moduleQuery, setModuleQuery] = useState('');
  const [studentSort, setStudentSort] = useState<'nameAsc' | 'nameDesc' | 'userName'>('nameAsc');
  const [moduleSort, setModuleSort] = useState<'codeAsc' | 'codeDesc' | 'nameAsc'>('codeAsc');

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  const [studentForm, setStudentForm] = useState<Student>(emptyStudent);
  const [moduleForm, setModuleForm] = useState<Module>(emptyModule);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);

  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>(emptyRegistration);
  const [gradeForm, setGradeForm] = useState<GradeFormState>(emptyGrade);
  const [savingMessage, setSavingMessage] = useState('');
  const [savingError, setSavingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setError(err instanceof Error ? err.message : 'Unable to load explorer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    const sorted = [...students].sort((a, b) => {
      if (studentSort === 'userName') {
        return a.userName.localeCompare(b.userName);
      }
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return studentSort === 'nameAsc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    if (!query) return sorted;
    return sorted.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        student.userName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
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

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  );

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  );

  const studentGrades = useMemo(
    () => grades.filter((grade) => grade.student?.id === selectedStudentId),
    [grades, selectedStudentId],
  );

  const studentRegistrations = useMemo(
    () => registrations.filter((registration) => registration.student?.id === selectedStudentId),
    [registrations, selectedStudentId],
  );

  const moduleRegistrations = useMemo(
    () => registrations.filter((registration) => registration.module?.id === selectedModuleId),
    [registrations, selectedModuleId],
  );

  const studentAverage = useMemo(() => {
    if (!studentGrades.length) return '–';
    const total = studentGrades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / studentGrades.length).toFixed(1);
  }, [studentGrades]);

  const startStudentForm = (student?: Student) => {
    setSavingMessage('');
    setSavingError('');
    setStudentForm(student ?? emptyStudent);
    setEditingStudentId(student?.id ?? null);
    setStudentFormOpen(true);
  };

  const startModuleForm = (module?: Module) => {
    setSavingMessage('');
    setSavingError('');
    setModuleForm(module ?? emptyModule);
    setEditingModuleId(module?.id ?? null);
    setModuleFormOpen(true);
  };

  const handleSaveStudent = async () => {
    setSubmitting(true);
    setSavingError('');
    setSavingMessage('');
    try {
      if (editingStudentId) {
        await apiFetch(`/students/${editingStudentId}`, { method: 'PUT', body: studentForm });
        setSavingMessage('Student updated.');
      } else {
        await apiFetch('/students', { method: 'POST', body: studentForm });
        setSavingMessage('Student created.');
      }
      setStudentFormOpen(false);
      setStudentForm(emptyStudent);
      setEditingStudentId(null);
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
      if (editingModuleId) {
        await apiFetch(`/modules/${editingModuleId}`, { method: 'PUT', body: moduleForm });
        setSavingMessage('Module updated.');
      } else {
        await apiFetch('/modules', { method: 'POST', body: moduleForm });
        setSavingMessage('Module created.');
      }
      setModuleFormOpen(false);
      setModuleForm(emptyModule);
      setEditingModuleId(null);
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStudent = async (id?: number) => {
    if (!id) return;
    setSubmitting(true);
    setSavingError('');
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' });
      if (selectedStudentId === id) {
        setSelectedStudentId(null);
      }
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to delete student');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteModule = async (id?: number) => {
    if (!id) return;
    setSubmitting(true);
    setSavingError('');
    try {
      await apiFetch(`/modules/${id}`, { method: 'DELETE' });
      if (selectedModuleId === id) {
        setSelectedModuleId(null);
      }
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to delete module');
    } finally {
      setSubmitting(false);
    }
  };

  const saveRegistration = async () => {
    if (!registrationForm.studentId || !registrationForm.moduleId) {
      setSavingError('Choose a student and module before saving a registration.');
      return;
    }
    setSubmitting(true);
    setSavingError('');
    setSavingMessage('');
    try {
      if (registrationForm.id) {
        await apiFetch(`/registrations/${registrationForm.id}`, {
          method: 'PUT',
          body: {
            studentId: Number(registrationForm.studentId),
            moduleId: Number(registrationForm.moduleId),
          },
        });
        setSavingMessage('Registration updated.');
      } else {
        await apiFetch('/registrations', {
          method: 'POST',
          body: {
            studentId: Number(registrationForm.studentId),
            moduleId: Number(registrationForm.moduleId),
          },
        });
        setSavingMessage('Registration created.');
      }
      setRegistrationForm(emptyRegistration);
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to save registration');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRegistration = async (id?: number) => {
    if (!id) return;
    setSubmitting(true);
    setSavingError('');
    try {
      await apiFetch(`/registrations/${id}`, { method: 'DELETE' });
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to delete registration');
    } finally {
      setSubmitting(false);
    }
  };

  const saveGrade = async () => {
    if (!gradeForm.studentId || !gradeForm.moduleId) {
      setSavingError('Select a student and module to save a grade.');
      return;
    }
    setSubmitting(true);
    setSavingError('');
    setSavingMessage('');
    try {
      await apiFetch('/grades/upsert', {
        method: 'POST',
        body: {
          studentId: Number(gradeForm.studentId),
          moduleId: Number(gradeForm.moduleId),
          score: Number(gradeForm.score),
        },
      });
      setSavingMessage('Grade saved.');
      setGradeForm(emptyGrade);
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to save grade');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGrade = async (id?: number) => {
    if (!id) return;
    setSubmitting(true);
    setSavingError('');
    try {
      await apiFetch(`/grades/${id}`, { method: 'DELETE' });
      await fetchAll();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to delete grade');
    } finally {
      setSubmitting(false);
    }
  };

  const openRegistrationForStudent = (student: Student) => {
    setRegistrationForm((prev) => ({ ...prev, studentId: student.id?.toString() ?? '' }));
  };

  const openRegistrationForModule = (module: Module) => {
    setRegistrationForm((prev) => ({ ...prev, moduleId: module.id?.toString() ?? '' }));
  };

  const openGradeForStudent = (student: Student) => {
    setGradeForm((prev) => ({ ...prev, studentId: student.id?.toString() ?? '' }));
  };

  return (
    <div className="glass-panel" id="explorer">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Explorer</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Search, sort, and maintain</h1>
          <p className="text-slate-200/80">
            View every student and module, drill into registrations and grades, and keep data fresh with add / edit / delete controls.
          </p>
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <div className="grid gap-6 xl:grid-cols-2" id="students">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Students</h2>
                <p className="text-sm text-slate-300">Clickable rows reveal registrations and grades.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startStudentForm()}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow hover:-translate-y-[1px] transition"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                className="field flex-1 min-w-[12rem]"
                placeholder="Search students"
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
                <option value="userName">Username</option>
              </select>
            </div>
            <div className="mt-4 space-y-3 max-h-[32rem] overflow-auto pr-2">
              {filteredStudents.map((student) => (
                <div
                  key={`${student.userName}-${student.email}`}
                  className={`rounded-2xl p-4 ring-1 transition ${
                    selectedStudentId === student.id
                      ? 'bg-emerald-500/15 ring-emerald-300/60'
                      : 'bg-black/30 ring-white/10 hover:ring-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{student.userName}</p>
                      <p className="text-lg font-semibold text-white">{student.firstName} {student.lastName}</p>
                      <p className="text-sm text-slate-300">{student.email}</p>
                    </div>
                    <div className="flex flex-col gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(student.id ?? null)}
                        className="rounded-full bg-white/10 px-3 py-1 text-slate-200 ring-1 ring-white/10 hover:bg-white/20"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => startStudentForm(student)}
                        className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteStudent(student.id)}
                        className="rounded-full bg-rose-500/80 px-3 py-1 font-semibold text-white shadow"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && !filteredStudents.length && <p className="text-slate-300">No students match that search.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10" id="modules">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Modules</h2>
                <p className="text-sm text-slate-300">Searchable catalogue with linked registrations.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startModuleForm()}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow hover:-translate-y-[1px] transition"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                className="field flex-1 min-w-[12rem]"
                placeholder="Search modules"
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
            <div className="mt-4 space-y-3 max-h-[32rem] overflow-auto pr-2">
              {filteredModules.map((module) => (
                <div
                  key={`${module.code}-${module.name}`}
                  className={`rounded-2xl p-4 ring-1 transition ${
                    selectedModuleId === module.id
                      ? 'bg-sky-500/15 ring-sky-300/60'
                      : 'bg-black/30 ring-white/10 hover:ring-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{module.code}</p>
                      <p className="text-lg font-semibold text-white">{module.name}</p>
                      <p className="text-sm text-slate-300">{module.mnc ? 'Mandatory' : 'Elective'}</p>
                    </div>
                    <div className="flex flex-col gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedModuleId(module.id ?? null)}
                        className="rounded-full bg-white/10 px-3 py-1 text-slate-200 ring-1 ring-white/10 hover:bg-white/20"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => startModuleForm(module)}
                        className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteModule(module.id)}
                        className="rounded-full bg-rose-500/80 px-3 py-1 font-semibold text-white shadow"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && !filteredModules.length && <p className="text-slate-300">No modules match that search.</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2" id="registrations">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Registration + grade desk</h3>
              <div className="pill bg-white/10 text-xs text-slate-200">Add & edit</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="regStudent">Student</label>
                <select
                  id="regStudent"
                  value={registrationForm.studentId}
                  onChange={(e) => setRegistrationForm((prev) => ({ ...prev, studentId: e.target.value }))}
                  className="field"
                >
                  <option value="">Choose student</option>
                  {students.map((student) => (
                    <option key={student.id ?? student.userName} value={student.id}>{`${student.firstName} ${student.lastName}`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="regModule">Module</label>
                <select
                  id="regModule"
                  value={registrationForm.moduleId}
                  onChange={(e) => setRegistrationForm((prev) => ({ ...prev, moduleId: e.target.value }))}
                  className="field"
                >
                  <option value="">Choose module</option>
                  {modules.map((module) => (
                    <option key={module.id ?? module.code} value={module.id}>{module.code} — {module.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveRegistration}
                disabled={submitting}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow disabled:opacity-70"
              >
                {registrationForm.id ? 'Update registration' : 'Add registration'}
              </button>
              <button
                type="button"
                onClick={() => setRegistrationForm(emptyRegistration)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-200 ring-1 ring-white/15"
              >
                Clear
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="gradeStudent">Grade student</label>
                <select
                  id="gradeStudent"
                  value={gradeForm.studentId}
                  onChange={(e) => setGradeForm((prev) => ({ ...prev, studentId: e.target.value }))}
                  className="field"
                >
                  <option value="">Choose student</option>
                  {students.map((student) => (
                    <option key={student.id ?? student.userName} value={student.id}>{`${student.firstName} ${student.lastName}`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="gradeModule">Grade module</label>
                <select
                  id="gradeModule"
                  value={gradeForm.moduleId}
                  onChange={(e) => setGradeForm((prev) => ({ ...prev, moduleId: e.target.value }))}
                  className="field"
                >
                  <option value="">Choose module</option>
                  {modules.map((module) => (
                    <option key={module.id ?? module.code} value={module.id}>{module.code} — {module.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm text-slate-200" htmlFor="gradeScore">Score</label>
                <input
                  id="gradeScore"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm((prev) => ({ ...prev, score: e.target.value }))}
                  className="field"
                  placeholder="95"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveGrade}
                disabled={submitting}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow disabled:opacity-70"
              >
                Add grade
              </button>
              <button
                type="button"
                onClick={() => setGradeForm(emptyGrade)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-200 ring-1 ring-white/15"
              >
                Clear
              </button>
            </div>

            {savingMessage && <p className="mt-4 text-sm text-emerald-300">{savingMessage}</p>}
            {savingError && <p className="mt-2 text-sm text-rose-300">{savingError}</p>}
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10" id="grades">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">All registrations</h3>
              <button
                type="button"
                onClick={fetchAll}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 hover:bg-white/20"
              >
                Refresh
              </button>
            </div>
            <div className="mt-4 space-y-3 max-h-[26rem] overflow-auto pr-2">
              {registrations.map((registration) => (
                <div
                  key={`${registration.id ?? `${registration.student?.userName}-${registration.module?.code}`}`}
                  className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-200">
                      {registration.student?.userName ?? 'Unknown student'} → {registration.module?.code ?? 'Unknown module'}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setRegistrationForm({
                          id: registration.id,
                          studentId: registration.student?.id?.toString() ?? '',
                          moduleId: registration.module?.id?.toString() ?? '',
                        })}
                        className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRegistration(registration.id)}
                        className="rounded-full bg-rose-500/80 px-3 py-1 font-semibold text-white shadow"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && !registrations.length && <p className="text-slate-300">No registrations recorded yet.</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Student detail</h3>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => openGradeForStudent(selectedStudent)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
                >
                  Add grade
                </button>
              )}
            </div>
            {selectedStudent ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{selectedStudent.userName}</p>
                    <p className="text-lg font-semibold text-white">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                    <p className="text-sm text-slate-300">{selectedStudent.email}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <span className="pill bg-white/10">Average score: {studentAverage}</span>
                    <button
                      type="button"
                      onClick={() => startStudentForm(selectedStudent)}
                      className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Registrations</h4>
                    <button
                      type="button"
                      onClick={() => {
                        openRegistrationForStudent(selectedStudent);
                      }}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {studentRegistrations.map((registration) => (
                      <div
                        key={`${registration.id ?? `${registration.student?.userName}-${registration.module?.code}`}`}
                        className="rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-200">{registration.module?.code ?? 'Module'}</p>
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setRegistrationForm({
                                id: registration.id,
                                studentId: registration.student?.id?.toString() ?? '',
                                moduleId: registration.module?.id?.toString() ?? '',
                              })}
                              className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRegistration(registration.id)}
                              className="rounded-full bg-rose-500/80 px-3 py-1 font-semibold text-white shadow"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!studentRegistrations.length && (
                      <p className="text-sm text-slate-300">No registrations for this student.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Grades</h4>
                    <button
                      type="button"
                      onClick={() => openGradeForStudent(selectedStudent)}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {studentGrades.map((grade) => (
                      <div
                        key={`${grade.id ?? `${grade.student?.userName}-${grade.module?.code}`}`}
                        className="rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-200">{grade.module?.code ?? 'Module'} — {grade.score ?? '—'}</p>
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setGradeForm({
                                id: grade.id,
                                studentId: grade.student?.id?.toString() ?? '',
                                moduleId: grade.module?.id?.toString() ?? '',
                                score: grade.score?.toString() ?? '',
                              })}
                              className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGrade(grade.id)}
                              className="rounded-full bg-rose-500/80 px-3 py-1 font-semibold text-white shadow"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!studentGrades.length && (
                      <p className="text-sm text-slate-300">No grades for this student yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-300">Select a student to view details.</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Module detail</h3>
              {selectedModule && (
                <button
                  type="button"
                  onClick={() => openRegistrationForModule(selectedModule)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
                >
                  Add registration
                </button>
              )}
            </div>
            {selectedModule ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{selectedModule.code}</p>
                    <p className="text-lg font-semibold text-white">{selectedModule.name}</p>
                    <p className="text-sm text-slate-300">{selectedModule.mnc ? 'Mandatory' : 'Elective'}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <span className="pill bg-white/10">{moduleRegistrations.length} registrations</span>
                    <button
                      type="button"
                      onClick={() => startModuleForm(selectedModule)}
                      className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Students</h4>
                    <button
                      type="button"
                      onClick={() => selectedModule && openRegistrationForModule(selectedModule)}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {moduleRegistrations.map((registration) => (
                      <div
                        key={`${registration.id ?? `${registration.student?.userName}-${registration.module?.code}`}`}
                        className="rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-200">{registration.student?.userName ?? 'Student'}</p>
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setRegistrationForm({
                                id: registration.id,
                                studentId: registration.student?.id?.toString() ?? '',
                                moduleId: registration.module?.id?.toString() ?? '',
                              })}
                              className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRegistration(registration.id)}
                              className="rounded-full bg-rose-500/80 px-3 py-1 font-semibold text-white shadow"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!moduleRegistrations.length && (
                      <p className="text-sm text-slate-300">No students registered yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-300">Select a module to view registrations.</p>
            )}
          </div>
        </div>

        {(studentFormOpen || moduleFormOpen) && (
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{studentFormOpen ? (editingStudentId ? 'Edit student' : 'Add student') : editingModuleId ? 'Edit module' : 'Add module'}</h3>
              <button
                type="button"
                onClick={() => {
                  setStudentFormOpen(false);
                  setModuleFormOpen(false);
                  setStudentForm(emptyStudent);
                  setModuleForm(emptyModule);
                  setEditingStudentId(null);
                  setEditingModuleId(null);
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
              >
                Close
              </button>
            </div>

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
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow disabled:opacity-70"
                  >
                    {editingStudentId ? 'Update student' : 'Add student'}
                  </button>
                  {editingStudentId && (
                    <button
                      type="button"
                      onClick={() => deleteStudent(editingStudentId)}
                      className="rounded-2xl bg-rose-500/80 px-4 py-3 text-sm font-semibold text-white shadow"
                    >
                      Delete
                    </button>
                  )}
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
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow disabled:opacity-70"
                  >
                    {editingModuleId ? 'Update module' : 'Add module'}
                  </button>
                  {editingModuleId && (
                    <button
                      type="button"
                      onClick={() => deleteModule(editingModuleId)}
                      className="rounded-2xl bg-rose-500/80 px-4 py-3 text-sm font-semibold text-white shadow"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;

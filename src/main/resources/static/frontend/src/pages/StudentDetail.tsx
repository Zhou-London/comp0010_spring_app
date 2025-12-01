import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade, type Module, type Registration, type Student } from '../types';

interface RegistrationFormState {
  id?: number;
  moduleId: string;
}

interface GradeFormState {
  id?: number;
  moduleId: string;
  score: string;
}

const emptyStudent: Student = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
};

const emptyRegistration: RegistrationFormState = {
  moduleId: '',
};

const emptyGrade: GradeFormState = {
  moduleId: '',
  score: '',
};

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const id = Number(studentId);

  const [student, setStudent] = useState<Student | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [studentForm, setStudentForm] = useState<Student>(emptyStudent);
  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>(emptyRegistration);
  const [gradeForm, setGradeForm] = useState<GradeFormState>(emptyGrade);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [studentResponse, modulesResponse, registrationsResponse, gradesResponse] = await Promise.all([
        apiFetch<Student>(`/students/${id}`),
        apiFetch<CollectionResponse<Module>>('/modules'),
        apiFetch<CollectionResponse<Registration>>('/registrations'),
        apiFetch<CollectionResponse<Grade>>('/grades'),
      ]);

      setStudent(studentResponse);
      setStudentForm(studentResponse);
      setModules(unwrapCollection(modulesResponse, 'modules'));
      const allRegistrations = unwrapCollection(registrationsResponse, 'registrations');
      setRegistrations(allRegistrations.filter((registration) => registration.student?.id === id));
      const allGrades = unwrapCollection(gradesResponse, 'grades');
      setGrades(allGrades.filter((grade) => grade.student?.id === id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [studentId]);

  const averageScore = useMemo(() => {
    if (!grades.length) return '–';
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / grades.length).toFixed(1);
  }, [grades]);

  const handleSaveStudent = async () => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/students/${id}`, { method: 'PUT', body: studentForm });
      setMessage('Student updated.');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' });
      navigate('/explorer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete student');
    } finally {
      setSubmitting(false);
    }
  };

  const saveRegistration = async () => {
    if (!id || !registrationForm.moduleId) {
      setError('Choose a module before saving a registration.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (registrationForm.id) {
        await apiFetch(`/registrations/${registrationForm.id}`, {
          method: 'PUT',
          body: { studentId: id, moduleId: Number(registrationForm.moduleId) },
        });
        setMessage('Registration updated.');
      } else {
        await apiFetch('/registrations', {
          method: 'POST',
          body: { studentId: id, moduleId: Number(registrationForm.moduleId) },
        });
        setMessage('Registration created.');
      }
      setRegistrationForm(emptyRegistration);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save registration');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRegistration = async (registrationId?: number) => {
    if (!registrationId) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/registrations/${registrationId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete registration');
    } finally {
      setSubmitting(false);
    }
  };

  const saveGrade = async () => {
    if (!id || !gradeForm.moduleId) {
      setError('Select a module to save a grade.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch('/grades/upsert', {
        method: 'POST',
        body: {
          studentId: id,
          moduleId: Number(gradeForm.moduleId),
          score: Number(gradeForm.score),
        },
      });
      setMessage('Grade saved.');
      setGradeForm(emptyGrade);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save grade');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGrade = async (gradeId?: number) => {
    if (!gradeId) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/grades/${gradeId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete grade');
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="glass-panel">
        <div className="p-8 text-white">No student ID provided.</div>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Student detail</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Profile and records</h1>
            <p className="text-slate-200/80">Update this student, manage registrations, and maintain grades.</p>
          </div>
          <Link
            to="/explorer"
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/20 hover:bg-white/20"
          >
            Back to explorer
          </Link>
        </div>

        {loading && <p className="text-slate-200">Loading…</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}

        {student && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{student.userName}</p>
                  <h2 className="text-xl font-semibold text-white">{student.firstName} {student.lastName}</h2>
                  <p className="text-sm text-slate-300">ID: {student.id}</p>
                </div>
                <span className="pill bg-white/10">Average score: {averageScore}</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-slate-200" htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-200" htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-200" htmlFor="userName">Username</label>
                  <input
                    id="userName"
                    value={studentForm.userName}
                    onChange={(e) => setStudentForm({ ...studentForm, userName: e.target.value })}
                    className="field"
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
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveStudent}
                    disabled={submitting}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow disabled:opacity-70"
                  >
                    Update student
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteStudent}
                    className="rounded-2xl bg-rose-500/80 px-4 py-3 text-sm font-semibold text-white shadow"
                  >
                    Delete student
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/5 bg-white/5 p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">Registrations</h3>
                  <button
                    type="button"
                    onClick={() => setRegistrationForm(emptyRegistration)}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                    >
                      <div>
                        <p className="text-sm text-slate-200">{registration.module?.code ?? 'Module'}</p>
                        <p className="text-xs text-slate-400">{registration.module?.name}</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setRegistrationForm({
                            id: registration.id,
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
                  ))}
                  {!registrations.length && <p className="text-sm text-slate-300">No registrations recorded yet.</p>}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm text-slate-200" htmlFor="moduleId">Module</label>
                    <select
                      id="moduleId"
                      value={registrationForm.moduleId}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, moduleId: e.target.value })}
                      className="field"
                    >
                      <option value="">Select a module</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>{module.code} — {module.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={saveRegistration}
                      disabled={submitting}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow disabled:opacity-70"
                    >
                      {registrationForm.id ? 'Update registration' : 'Create registration'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/5 p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">Grades</h3>
                  <button
                    type="button"
                    onClick={() => setGradeForm(emptyGrade)}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                    >
                      <div>
                        <p className="text-sm text-slate-200">{grade.module?.code ?? 'Module'} — {grade.score ?? '—'}</p>
                        <p className="text-xs text-slate-400">{grade.module?.name}</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setGradeForm({
                            id: grade.id,
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
                  ))}
                  {!grades.length && <p className="text-sm text-slate-300">No grades recorded yet.</p>}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="gradeModule">Module</label>
                    <select
                      id="gradeModule"
                      value={gradeForm.moduleId}
                      onChange={(e) => setGradeForm({ ...gradeForm, moduleId: e.target.value })}
                      className="field"
                    >
                      <option value="">Select a module</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>{module.code} — {module.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="score">Score</label>
                    <input
                      id="score"
                      type="number"
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                      className="field"
                      placeholder="75"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={saveGrade}
                      disabled={submitting}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow disabled:opacity-70"
                    >
                      {gradeForm.id ? 'Update grade' : 'Save grade'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;

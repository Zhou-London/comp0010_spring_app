import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { type Grade, type Module, type Registration, type Student } from '../types';

interface RegistrationFormState {
  id?: number;
  studentId: string;
}

interface GradeFormState {
  id?: number;
  studentId: string;
  score: string;
}

const emptyModule: Module = {
  code: '',
  name: '',
  mnc: false,
};

const emptyRegistration: RegistrationFormState = {
  studentId: '',
};

const emptyGrade: GradeFormState = {
  studentId: '',
  score: '',
};

const ModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const id = Number(moduleId);

  const [module, setModule] = useState<Module | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [moduleForm, setModuleForm] = useState<Module>(emptyModule);
  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>(emptyRegistration);
  const [gradeForm, setGradeForm] = useState<GradeFormState>(emptyGrade);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingModule, setEditingModule] = useState(false);
  const [editingRegistrationId, setEditingRegistrationId] = useState<number | 'new' | null>(null);
  const [editingGradeId, setEditingGradeId] = useState<number | 'new' | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [moduleResponse, studentsResponse, registrationsResponse, gradesResponse] = await Promise.all([
        apiFetch<Module>(`/modules/${id}`),
        apiFetch<CollectionResponse<Student>>('/students'),
        apiFetch<CollectionResponse<Registration>>('/registrations'),
        apiFetch<CollectionResponse<Grade>>('/grades'),
      ]);

      setModule(moduleResponse);
      setModuleForm(moduleResponse);
      setStudents(unwrapCollection(studentsResponse, 'students'));
      const allRegistrations = unwrapCollection(registrationsResponse, 'registrations');
      setRegistrations(allRegistrations.filter((registration) => registration.module?.id === id));
      const allGrades = unwrapCollection(gradesResponse, 'grades');
      setGrades(allGrades.filter((grade) => grade.module?.id === id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load module');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [moduleId]);

  const averageGrade = useMemo(() => {
    if (!grades.length) return '–';
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / grades.length).toFixed(1);
  }, [grades]);

  const handleSaveModule = async () => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/modules/${id}`, { method: 'PUT', body: moduleForm });
      setMessage('Module updated.');
      setEditingModule(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/modules/${id}`, { method: 'DELETE' });
      navigate('/modules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete module');
    } finally {
      setSubmitting(false);
    }
  };

  const saveRegistration = async () => {
    if (!id || !registrationForm.studentId) {
      setError('Choose a student before saving a registration.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (registrationForm.id) {
        await apiFetch(`/registrations/${registrationForm.id}`, {
          method: 'PUT',
          body: { studentId: Number(registrationForm.studentId), moduleId: id },
        });
        setMessage('Registration updated.');
      } else {
        await apiFetch('/registrations', {
          method: 'POST',
          body: { studentId: Number(registrationForm.studentId), moduleId: id },
        });
        setMessage('Registration created.');
      }
      setRegistrationForm(emptyRegistration);
      setEditingRegistrationId(null);
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
    if (!id || !gradeForm.studentId) {
      setError('Select a student to save a grade.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch('/grades/upsert', {
        method: 'POST',
        body: {
          studentId: Number(gradeForm.studentId),
          moduleId: id,
          score: Number(gradeForm.score),
        },
      });
      setMessage('Grade saved.');
      setGradeForm(emptyGrade);
      setEditingGradeId(null);
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
        <div className="p-8 text-white">No module ID provided.</div>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Module detail</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Module profile</h1>
            <p className="text-slate-200/80">Update this module, registrations, and grades in one place.</p>
          </div>
          <Link
            to="/modules"
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/20 hover:bg-white/20"
          >
            Back to modules
          </Link>
        </div>

        {loading && <p className="text-slate-200">Loading…</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}

        {module && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Module profile</p>
                  <h2 className="text-xl font-semibold text-white">Module details</h2>
                </div>
                <button
                  type="button"
                  className="icon-button accent px-4 py-2 text-sm"
                  onClick={() => requireAuth(() => {
                    setModuleForm(module);
                    setEditingModule((prev) => !prev);
                  })}
                  aria-label="Edit module"
                >
                  <span aria-hidden>{editingModule ? '✖️' : '✏️'}</span>
                  <span>{editingModule ? 'Close' : 'Edit'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="info-row">
                  <span className="info-label">Module code</span>
                  {editingModule ? (
                    <input
                      id="code"
                      value={moduleForm.code}
                      onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
                      className="field max-w-sm"
                    />
                  ) : (
                    <span className="info-value">{module.code}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Module name</span>
                  {editingModule ? (
                    <input
                      id="name"
                      value={moduleForm.name}
                      onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                      className="field max-w-sm"
                    />
                  ) : (
                    <span className="info-value">{module.name}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Mandatory</span>
                  {editingModule ? (
                    <label className="flex items-center gap-3">
                      <input
                        id="mnc"
                        type="checkbox"
                        checked={moduleForm.mnc}
                        onChange={(e) => setModuleForm({ ...moduleForm, mnc: e.target.checked })}
                        className="h-5 w-5 rounded border-white/30 bg-white/10 text-sky-400 focus:ring-white/40"
                      />
                      <span className="text-slate-200">Mandatory module</span>
                    </label>
                  ) : (
                    <span className="info-value">{module.mnc ? 'Mandatory' : 'Elective'}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Module ID</span>
                  <span className="info-value">{module.id}</span>
                </div>
              </div>

              {editingModule && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => requireAuth(handleSaveModule)}
                    disabled={submitting}
                    className="icon-button accent"
                    aria-label="Save module"
                  >
                    <span aria-hidden>💾</span>
                    <span className="sr-only">Save module</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModule(false);
                      setModuleForm(module);
                    }}
                    className="icon-button text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => requireAuth(handleDeleteModule)}
                    className="icon-button danger"
                    aria-label="Delete module"
                  >
                    <span aria-hidden>🗑️</span>
                    <span className="sr-only">Delete module</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/5 bg-white/5 p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">Registrations</h3>
                  <button
                    type="button"
                    onClick={() => requireAuth(() => {
                      setRegistrationForm(emptyRegistration);
                      setEditingRegistrationId((prev) => (prev === 'new' ? null : 'new'));
                    })}
                    className="icon-button text-xs"
                    aria-label="Add registration"
                  >
                    <span aria-hidden>{editingRegistrationId === 'new' ? '—' : '➕'}</span>
                  </button>
                </div>
                {editingRegistrationId !== null && (
                  <div className="mt-3 space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="studentId">Student</label>
                      <select
                        id="studentId"
                        value={registrationForm.studentId}
                        onChange={(e) => setRegistrationForm({ ...registrationForm, studentId: e.target.value })}
                        className="field"
                      >
                        <option value="">Select a student</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>{student.userName} — {student.email}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => requireAuth(saveRegistration)}
                        disabled={submitting}
                        className="icon-button accent"
                        aria-label={registrationForm.id ? 'Update registration' : 'Create registration'}
                      >
                        <span aria-hidden>💾</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRegistrationId(null);
                          setRegistrationForm(emptyRegistration);
                        }}
                        className="icon-button text-xs"
                      >
                        Cancel
                      </button>
                      {registrationForm.id && (
                        <button
                          type="button"
                          onClick={() => requireAuth(() => deleteRegistration(registrationForm.id))}
                          className="icon-button danger"
                          aria-label="Delete registration"
                        >
                          <span aria-hidden>🗑️</span>
                          <span className="sr-only">Delete registration</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                    >
                      <div>
                        <p className="text-sm text-slate-200">{registration.student?.userName ?? 'Student'}</p>
                        <p className="text-xs text-slate-400">{registration.student?.email}</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => requireAuth(() => {
                            setRegistrationForm({
                              id: registration.id,
                              studentId: registration.student?.id?.toString() ?? '',
                            });
                            setEditingRegistrationId(registration.id ?? null);
                          })}
                          className="icon-button px-3 py-2"
                          aria-label="Edit registration"
                        >
                          <span aria-hidden>✏️</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {!registrations.length && <p className="text-sm text-slate-300">No registrations recorded yet.</p>}
                </div>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/5 p-6 ring-1 ring-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">Grades</h3>
                    <span className="pill bg-white/10 text-xs">Avg grade: {averageGrade}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => requireAuth(() => {
                      setGradeForm(emptyGrade);
                      setEditingGradeId((prev) => (prev === 'new' ? null : 'new'));
                    })}
                    className="icon-button text-xs"
                    aria-label="Add grade"
                  >
                    <span aria-hidden>{editingGradeId === 'new' ? '—' : '➕'}</span>
                  </button>
                </div>
                {editingGradeId !== null && (
                  <div className="mt-3 space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm text-slate-200" htmlFor="gradeStudent">Student</label>
                        <select
                          id="gradeStudent"
                          value={gradeForm.studentId}
                          onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
                          className="field"
                        >
                          <option value="">Select a student</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>{student.userName} — {student.email}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-200" htmlFor="moduleScore">Score</label>
                        <input
                          id="moduleScore"
                          type="number"
                          value={gradeForm.score}
                          onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                          className="field"
                          placeholder="80"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => requireAuth(saveGrade)}
                        disabled={submitting}
                        className="icon-button accent"
                        aria-label={gradeForm.id ? 'Update grade' : 'Save grade'}
                      >
                        <span aria-hidden>💾</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGradeId(null);
                          setGradeForm(emptyGrade);
                        }}
                        className="icon-button text-xs"
                      >
                        Cancel
                      </button>
                      {gradeForm.id && (
                        <button
                          type="button"
                          onClick={() => requireAuth(() => deleteGrade(gradeForm.id))}
                          className="icon-button danger"
                          aria-label="Delete grade"
                        >
                          <span aria-hidden>🗑️</span>
                          <span className="sr-only">Delete grade</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
                    >
                      <div>
                        <p className="text-sm text-slate-200">{grade.student?.userName ?? 'Student'} — {grade.score ?? '—'}</p>
                        <p className="text-xs text-slate-400">{grade.student?.email}</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => requireAuth(() => {
                            setGradeForm({
                              id: grade.id,
                              studentId: grade.student?.id?.toString() ?? '',
                              score: grade.score?.toString() ?? '',
                            });
                            setEditingGradeId(grade.id ?? null);
                          })}
                          className="icon-button px-3 py-2"
                          aria-label="Edit grade"
                        >
                          <span aria-hidden>✏️</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {!grades.length && <p className="text-sm text-slate-300">No grades recorded yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;

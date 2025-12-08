import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { useErrorOverlay } from '../contexts/ErrorContext';
import { type Grade, type Module, type ModuleStatistics, type Registration, type Student } from '../types';

interface AppContext {
  refreshOps: () => void;
  setRevertHandler: (handler?: () => void) => void;
}

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
  department: '',
  requiredYear: null,
  prerequisiteModule: null,
};

const emptyRegistration: RegistrationFormState = {
  studentId: '',
};

const emptyGrade: GradeFormState = {
  studentId: '',
  score: '',
};

const ModuleDetail = () => {
  const { moduleId, section } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const { showError } = useErrorOverlay();
  const { refreshOps, setRevertHandler } = useOutletContext<AppContext>();
  const id = Number(moduleId);

  const activeSection: 'overview' | 'registrations' | 'grades' =
    section === 'registrations' ? 'registrations' : section === 'grades' ? 'grades' : 'overview';

  const [module, setModule] = useState<Module | null>(null);
  const [moduleStats, setModuleStats] = useState<ModuleStatistics | null>(null);
  const [allModules, setAllModules] = useState<Module[]>([]);
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

  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationSort, setRegistrationSort] = useState<'name' | 'email' | 'id'>('name');
  const [gradeQuery, setGradeQuery] = useState('');
  const [gradeSort, setGradeSort] = useState<'name' | 'scoreDesc' | 'scoreAsc'>('name');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [
        moduleResponse,
        statsResponse,
        modulesResponse,
        studentsResponse,
        registrationsResponse,
        gradesResponse,
      ] = await Promise.all([
        apiFetch<Module>(`/modules/${id}`),
        apiFetch<ModuleStatistics>(`/modules/${id}/statistics`),
        apiFetch<Module[]>('/modules'),
        apiFetch<CollectionResponse<Student>>('/students'),
        apiFetch<CollectionResponse<Registration>>('/registrations'),
        apiFetch<CollectionResponse<Grade>>('/grades'),
      ]);

      setModule(moduleResponse);
      setModuleStats(statsResponse);
      setModuleForm(moduleResponse);
      setAllModules(modulesResponse);
      setStudents(unwrapCollection(studentsResponse, 'students'));
      const allRegistrations = unwrapCollection(registrationsResponse, 'registrations');
      setRegistrations(allRegistrations.filter((registration: Registration) => registration.module?.id === id));
      const allGrades = unwrapCollection(gradesResponse, 'grades');
      setGrades(allGrades.filter((grade: Grade) => grade.module?.id === id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load module');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    setRevertHandler(() => fetchData);
    return () => setRevertHandler(undefined);
  }, [setRevertHandler, fetchData]);

  useEffect(() => {
    setEditingRegistrationId(null);
    setEditingGradeId(null);
    setRegistrationForm(emptyRegistration);
    setGradeForm(emptyGrade);
  }, [activeSection]);

  const averageGrade = useMemo(() => {
    if (moduleStats?.averageGrade != null) return moduleStats.averageGrade.toFixed(1);
    if (!grades.length) return '–';
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / grades.length).toFixed(1);
  }, [grades, moduleStats]);

  const selectionRate = useMemo(() => {
    if (!moduleStats) return '–';
    const percent = (moduleStats.selectionRate * 100).toFixed(1);
    return `${percent}% of ${moduleStats.totalStudents} students`;
  }, [moduleStats]);

  const passRate = useMemo(() => {
    if (moduleStats?.passRate == null) return '–';
    const percent = (moduleStats.passRate * 100).toFixed(1);
    return `${percent}% (${moduleStats.passingGrades}/${moduleStats.totalGrades})`;
  }, [moduleStats]);

  const filteredRegistrations = useMemo(() => {
    const query = registrationQuery.trim().toLowerCase();
    const sorted = [...registrations].sort((a, b) => {
      if (registrationSort === 'id') return (a.id ?? 0) - (b.id ?? 0);
      if (registrationSort === 'email')
        return (a.student?.email ?? '').localeCompare(b.student?.email ?? '');
      return (a.student?.userName ?? '').localeCompare(b.student?.userName ?? '');
    });

    if (!query) return sorted;
    return sorted.filter((registration) => {
      const name = registration.student?.userName?.toLowerCase() ?? '';
      const email = registration.student?.email?.toLowerCase() ?? '';
      return name.includes(query) || email.includes(query) || `${registration.id ?? ''}`.includes(query);
    });
  }, [registrationQuery, registrationSort, registrations]);

  const filteredGrades = useMemo(() => {
    const query = gradeQuery.trim().toLowerCase();
    const sorted = [...grades].sort((a, b) => {
      if (gradeSort === 'scoreAsc') return (a.score ?? 0) - (b.score ?? 0);
      if (gradeSort === 'scoreDesc') return (b.score ?? 0) - (a.score ?? 0);
      return (a.student?.userName ?? '').localeCompare(b.student?.userName ?? '');
    });

    if (!query) return sorted;
    return sorted.filter((grade) => {
      const name = grade.student?.userName?.toLowerCase() ?? '';
      const email = grade.student?.email?.toLowerCase() ?? '';
      return name.includes(query) || email.includes(query) || `${grade.score ?? ''}`.includes(query);
    });
  }, [gradeQuery, gradeSort, grades]);

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
      refreshOps();
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
      refreshOps();
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
      refreshOps();
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
      refreshOps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete registration');
    } finally {
      setSubmitting(false);
    }
  };

  const saveGrade = async () => {
    if (!id || !gradeForm.studentId) {
      showGradeError('Select a student to save a grade.');
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
      refreshOps();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save grade';
      showGradeError(message);
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
      refreshOps();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete grade';
      showGradeError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderSectionTabs = () => (
    <div className="flex flex-wrap gap-2">
      {[
        { key: 'overview', label: 'Overview', path: `/modules/${id}` },
        { key: 'registrations', label: 'Registrations', path: `/modules/${id}/registrations` },
        { key: 'grades', label: 'Grades', path: `/modules/${id}/grades` },
      ].map((tab) => (
        <Link key={tab.key} to={tab.path} className={`icon-button compact ${activeSection === tab.key ? 'accent' : ''}`}>
          {tab.label}
        </Link>
      ))}
    </div>
  );

  const closeRegistrationModal = () => {
    setEditingRegistrationId(null);
    setRegistrationForm(emptyRegistration);
  };

  const closeGradeModal = () => {
    setEditingGradeId(null);
    setGradeForm(emptyGrade);
  };

  const showGradeError = (message: string) => {
    closeGradeModal();
    showError({
      title: 'Grade save error',
      message,
      tips: [
        'Reopen the Add Grade form and confirm the student and score.',
        'Verify your login session is active before retrying.',
        'If the error persists, refresh the page and try again.',
      ],
    });
  };

  const openRegistrationEditor = (registration?: Registration) => {
    if (registration) {
      setRegistrationForm({ id: registration.id, studentId: registration.student?.id?.toString() ?? '' });
      setEditingRegistrationId(registration.id ?? null);
    } else {
      setRegistrationForm(emptyRegistration);
      setEditingRegistrationId('new');
    }
  };

  const openGradeEditor = (grade?: Grade) => {
    if (grade) {
      setGradeForm({
        id: grade.id,
        studentId: grade.student?.id?.toString() ?? '',
        score: grade.score?.toString() ?? '',
      });
      setEditingGradeId(grade.id ?? null);
    } else {
      setGradeForm(emptyGrade);
      setEditingGradeId('new');
    }
  };

  const renderRegistrationModal = () =>
    editingRegistrationId !== null && (
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="modal-card w-full max-w-lg space-y-4 rounded-3xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] opacity-70">{registrationForm.id ? 'Edit registration' : 'New registration'}</p>
              <h3 className="text-lg font-semibold">Assign a student to this module</h3>
            </div>
            <button type="button" onClick={closeRegistrationModal} className="icon-button compact text-[10px] px-2 py-1" aria-label="Close registration editor">
              <span aria-hidden>✖️</span>
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-sm opacity-80" htmlFor="studentId">Student</label>
            <select
              id="studentId"
              value={registrationForm.studentId}
              onChange={(e) => setRegistrationForm({ ...registrationForm, studentId: e.target.value })}
              className="field"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.userName} — {student.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => requireAuth(saveRegistration)}
              disabled={submitting}
              className="icon-button accent"
              aria-label={registrationForm.id ? 'Update registration' : 'Save registration'}
            >
              <span aria-hidden>💾</span>
              <span className="hidden sm:inline">Save</span>
            </button>
            {registrationForm.id && (
              <button
                type="button"
                onClick={() => requireAuth(() => deleteRegistration(registrationForm.id))}
                className="icon-button danger"
                aria-label="Delete registration"
              >
                <span aria-hidden>🗑️</span>
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button type="button" onClick={closeRegistrationModal} className="icon-button text-xs">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  const renderGradeModal = () =>
    editingGradeId !== null && (
      <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="modal-card w-full max-w-lg space-y-4 rounded-3xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] opacity-70">{gradeForm.id ? 'Edit grade' : 'New grade'}</p>
              <h3 className="text-lg font-semibold">Update this student score</h3>
            </div>
            <button type="button" onClick={closeGradeModal} className="icon-button compact text-[10px] px-2 py-1" aria-label="Close grade editor">
              <span aria-hidden>✖️</span>
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-sm opacity-80" htmlFor="gradeStudent">Student</label>
            <select
              id="gradeStudent"
              value={gradeForm.studentId}
              onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
              className="field"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.userName} — {student.email}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <label className="text-sm opacity-80" htmlFor="moduleScore">Score</label>
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
              <span className="hidden sm:inline">Save</span>
            </button>
            {gradeForm.id && (
              <button
                type="button"
                onClick={() => requireAuth(() => deleteGrade(gradeForm.id))}
                className="icon-button danger"
                aria-label="Delete grade"
              >
                <span aria-hidden>🗑️</span>
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button type="button" onClick={closeGradeModal} className="icon-button text-xs">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  const renderOverview = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-panel p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Module profile</p>
            <h2 className="text-xl font-semibold text-primary">Module details</h2>
          </div>
          <button
            type="button"
            className="icon-button accent px-4 py-2 text-sm"
            onClick={() =>
              requireAuth(() => {
                setModuleForm(module ?? emptyModule);
                setEditingModule((prev) => !prev);
              })
            }
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
              <span className="info-value">{module?.code}</span>
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
              <span className="info-value">{module?.name}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Department</span>
            {editingModule ? (
              <input
                id="department"
                value={moduleForm.department}
                onChange={(e) => setModuleForm({ ...moduleForm, department: e.target.value })}
                className="field max-w-sm"
              />
            ) : (
              <span className="info-value">{module?.department}</span>
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
                <span className="text-secondary">Mandatory module</span>
              </label>
            ) : (
              <span className="info-value">{module?.mnc ? 'Mandatory' : 'Elective'}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Required year</span>
            {editingModule ? (
              <input
                className="field max-w-[10rem]"
                type="number"
                min="1"
                value={moduleForm.requiredYear ?? ''}
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    requiredYear: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            ) : (
              <span className="info-value">{module?.requiredYear ?? 'Any'}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Prerequisite</span>
            {editingModule ? (
              <select
                className="field max-w-lg"
                value={moduleForm.prerequisiteModule?.id ?? ''}
                onChange={(e) => {
                  const chosen = e.target.value ? Number(e.target.value) : null;
                  const match = allModules.find((m) => m.id === chosen);
                  setModuleForm({
                    ...moduleForm,
                    prerequisiteModule: chosen ? { id: chosen, code: match?.code ?? '' } as Module : null,
                  });
                }}
              >
                <option value="">No prerequisite</option>
                {allModules
                  .filter((m) => m.id !== module?.id)
                  .map((m) => (
                    <option key={m.id ?? m.code} value={m.id}>
                      {m.code} · {m.name}
                    </option>
                  ))}
              </select>
            ) : (
              <span className="info-value">
                {module?.prerequisiteModule?.code ?? moduleStats?.prerequisiteCode ?? 'None'}
              </span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Module ID</span>
            <span className="info-value">{module?.id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Selection rate</span>
            <span className="info-value">{selectionRate}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Pass rate</span>
            <span className="info-value">{passRate}</span>
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
                setModuleForm(module ?? emptyModule);
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
        <div className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-primary">Registrations</h3>
            <div className="flex flex-wrap gap-2">
              <Link to={`/modules/${id}/registrations`} className="icon-button text-xs">
                Read more
              </Link>
              <button
                type="button"
                onClick={() => requireAuth(() => openRegistrationEditor())}
                className="icon-button text-xs"
                aria-label="Add registration"
              >
                <span aria-hidden>{editingRegistrationId === 'new' ? '—' : '➕'}</span>
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="surface-card flex items-center justify-between p-3"
              >
                <div>
                  <p className="text-sm text-primary">{registration.student?.userName ?? 'Student'}</p>
                  <p className="text-xs text-secondary">{registration.student?.email}</p>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => requireAuth(() => openRegistrationEditor(registration))}
                    className="icon-button compact text-[10px] px-2 py-1"
                    aria-label="Edit registration"
                  >
                    <span aria-hidden>✏️</span>
                  </button>
                </div>
              </div>
            ))}
            {!registrations.length && <p className="text-sm text-secondary">No registrations recorded yet.</p>}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-primary">Grades</h3>
              <span className="pill text-xs">Avg grade: {averageGrade}</span>
              <span className="pill text-xs">Pass rate: {passRate}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/modules/${id}/grades`} className="icon-button text-xs">
                Read more
              </Link>
              <button
                type="button"
                onClick={() => requireAuth(() => openGradeEditor())}
                className="icon-button text-xs"
                aria-label="Add grade"
              >
                <span aria-hidden>{editingGradeId === 'new' ? '—' : '➕'}</span>
              </button>
            </div>
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
            {grades.map((grade) => (
              <div
                key={grade.id}
                className="surface-card flex items-center justify-between p-3"
              >
                <div>
                  <p className="text-sm text-primary">{grade.student?.userName ?? 'Student'} — {grade.score ?? '—'}</p>
                  <p className="text-xs text-secondary">{grade.student?.email}</p>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => requireAuth(() => openGradeEditor(grade))}
                    className="icon-button compact text-[10px] px-2 py-1"
                    aria-label="Edit grade"
                  >
                    <span aria-hidden>✏️</span>
                  </button>
                </div>
              </div>
            ))}
            {!grades.length && <p className="text-sm text-secondary">No grades recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegistrationsPage = () => (
    <div className="glass-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">All registrations</p>
          <h2 className="text-xl font-semibold text-primary">Students attending this module</h2>
          <p className="text-sm text-secondary">Filter, edit, or remove module registrations in one place.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => requireAuth(() => openRegistrationEditor())}
            className="icon-button accent text-xs"
            aria-label="Add registration"
          >
            <span aria-hidden>{editingRegistrationId === 'new' ? '—' : '➕'}</span>
            <span className="hidden sm:inline">Add registration</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className="field"
          placeholder="Search by student name or email"
          value={registrationQuery}
          onChange={(e) => setRegistrationQuery(e.target.value)}
        />
        <select
          value={registrationSort}
          onChange={(e) => setRegistrationSort(e.target.value as typeof registrationSort)}
          className="field text-sm"
        >
          <option value="name">Student name</option>
          <option value="email">Email</option>
          <option value="id">Registration ID</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 explorer-grid">
        {filteredRegistrations.map((registration) => (
          <div key={registration.id} className="surface-card explorer-card flex flex-col gap-3 p-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0 space-y-1 break-words">
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">{registration.student?.userName ?? 'Student'}</p>
                <p className="text-lg font-semibold text-primary">{registration.student?.email ?? 'Unknown email'}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="pill text-xs break-words">ID: {registration.id ?? '—'}</span>
                <button
                  type="button"
                  onClick={() => requireAuth(() => openRegistrationEditor(registration))}
                  className="icon-button compact text-[10px] px-2 py-1"
                  aria-label="Edit registration"
                >
                  <span aria-hidden>✏️</span>
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filteredRegistrations.length && <p className="text-sm text-secondary">No registrations match your search.</p>}
      </div>
    </div>
  );

  const renderGradesPage = () => (
    <div className="glass-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">All grades</p>
          <h2 className="text-xl font-semibold text-primary">Assessment results for this module</h2>
          <p className="text-sm text-secondary">Review every student score, adjust them, or add new marks.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="pill text-xs">Average {averageGrade}</span>
          <button
            type="button"
            onClick={() => requireAuth(() => openGradeEditor())}
            className="icon-button accent text-xs"
            aria-label="Add grade"
          >
            <span aria-hidden>{editingGradeId === 'new' ? '—' : '➕'}</span>
            <span className="hidden sm:inline">Add grade</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className="field"
          placeholder="Search by student or score"
          value={gradeQuery}
          onChange={(e) => setGradeQuery(e.target.value)}
        />
        <select
          value={gradeSort}
          onChange={(e) => setGradeSort(e.target.value as typeof gradeSort)}
          className="field text-sm"
        >
          <option value="name">Student name</option>
          <option value="scoreDesc">Score: high to low</option>
          <option value="scoreAsc">Score: low to high</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 explorer-grid">
        {filteredGrades.map((grade) => (
          <div key={grade.id} className="surface-card explorer-card flex flex-col gap-3 p-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0 space-y-1 break-words">
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">{grade.student?.userName ?? 'Student'}</p>
                <p className="text-lg font-semibold text-primary">{grade.student?.email ?? 'Unknown email'}</p>
                <p className="text-2xl font-semibold text-primary">Score: {grade.score ?? '—'}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="pill text-xs break-words">ID: {grade.id ?? '—'}</span>
                <button
                  type="button"
                  onClick={() => requireAuth(() => openGradeEditor(grade))}
                  className="icon-button compact text-[10px] px-2 py-1"
                  aria-label="Edit grade"
                >
                  <span aria-hidden>✏️</span>
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filteredGrades.length && <p className="text-sm text-secondary">No grades match your search.</p>}
      </div>
    </div>
  );

  if (!id) {
    return (
      <div className="glass-panel">
        <div className="p-8 text-white">No module ID provided.</div>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-6 p-6 sm:gap-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Module detail</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Module records</h1>
            <p className="text-slate-200/80">Update this module, manage registrations, and maintain grades.</p>
            {renderSectionTabs()}
          </div>
          <Link
            to="/modules"
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/20 hover:bg-white/20"
          >
            Back to modules
          </Link>
        </div>

        {loading && <p className="text-slate-200">Loading…</p>}
        {error && (
          <ErrorMessage
            message={error}
            title="Module could not load"
            tips={[
              'Confirm the module still exists or return to the modules list.',
              'Refresh the page and try again if the connection was interrupted.',
              'If you recently changed permissions, sign back in before retrying.',
            ]}
          />
        )}
        {message && <p className="text-sm text-emerald-300">{message}</p>}

        {module && activeSection === 'overview' && renderOverview()}
        {module && activeSection === 'registrations' && renderRegistrationsPage()}
        {module && activeSection === 'grades' && renderGradesPage()}
        {renderRegistrationModal()}
        {renderGradeModal()}
      </div>
    </div>
  );
};

export default ModuleDetail;

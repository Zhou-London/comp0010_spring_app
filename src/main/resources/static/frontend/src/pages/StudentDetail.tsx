import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import OperationLogPanel from '../components/OperationLogPanel';
import { useAuth } from '../contexts/AuthContext';
import { useErrorOverlay } from '../contexts/ErrorContext';
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
  entryYear: null,
  graduateYear: null,
  major: '',
  tuitionFee: null,
  paidTuitionFee: null,
  birthDate: null,
  homeStudent: null,
  sex: '',
};

const emptyRegistration: RegistrationFormState = {
  moduleId: '',
};

const emptyGrade: GradeFormState = {
  moduleId: '',
  score: '',
};

const StudentDetail = () => {
  const { studentId, section } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const { showError } = useErrorOverlay();
  const id = Number(studentId);

  const activeSection: 'overview' | 'registrations' | 'grades' =
    section === 'registrations' ? 'registrations' : section === 'grades' ? 'grades' : 'overview';

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
  const [operationRefresh, setOperationRefresh] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [editingRegistrationId, setEditingRegistrationId] = useState<number | 'new' | null>(null);
  const [editingGradeId, setEditingGradeId] = useState<number | 'new' | null>(null);

  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationSort, setRegistrationSort] = useState<'code' | 'name' | 'id'>('code');
  const [gradeQuery, setGradeQuery] = useState('');
  const [gradeSort, setGradeSort] = useState<'module' | 'scoreDesc' | 'scoreAsc'>('module');

  const toNumberOrNull = (value: string) => (value ? Number(value) : null);
  const toBooleanOrNull = (value: string) => {
    if (value === '') return null;
    return value === 'true';
  };
  const formatCurrency = (value?: number | null) => {
    if (value == null) return '—';
    return `£${value.toFixed(2)}`;
  };

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
      setRegistrations(allRegistrations.filter((registration: Registration) => registration.student?.id === id));
      const allGrades = unwrapCollection(gradesResponse, 'grades');
      setGrades(allGrades.filter((grade: Grade) => grade.student?.id === id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [studentId]);

  useEffect(() => {
    setEditingRegistrationId(null);
    setEditingGradeId(null);
    setRegistrationForm(emptyRegistration);
    setGradeForm(emptyGrade);
  }, [activeSection]);

  const averageScore = useMemo(() => {
    if (!grades.length) return '–';
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / grades.length).toFixed(1);
  }, [grades]);

  const outstandingTuition = useMemo(() => {
    if (student?.tuitionFee == null) return null;
    const paid = student.paidTuitionFee ?? 0;
    return Number((student.tuitionFee - paid).toFixed(2));
  }, [student]);

  const residencyLabel = useMemo(() => {
    if (student?.homeStudent == null) return '—';
    return student.homeStudent ? 'Home student' : 'International';
  }, [student]);

  const filteredRegistrations = useMemo(() => {
    const query = registrationQuery.trim().toLowerCase();
    const sorted = [...registrations].sort((a, b) => {
      if (registrationSort === 'id') return (a.id ?? 0) - (b.id ?? 0);
      if (registrationSort === 'name') return (a.module?.name ?? '').localeCompare(b.module?.name ?? '');
      return (a.module?.code ?? '').localeCompare(b.module?.code ?? '');
    });

    if (!query) return sorted;
    return sorted.filter((registration) => {
      const code = registration.module?.code?.toLowerCase() ?? '';
      const name = registration.module?.name?.toLowerCase() ?? '';
      return code.includes(query) || name.includes(query) || `${registration.id ?? ''}`.includes(query);
    });
  }, [registrationQuery, registrationSort, registrations]);

  const filteredGrades = useMemo(() => {
    const query = gradeQuery.trim().toLowerCase();
    const sorted = [...grades].sort((a, b) => {
      if (gradeSort === 'scoreAsc') return (a.score ?? 0) - (b.score ?? 0);
      if (gradeSort === 'scoreDesc') return (b.score ?? 0) - (a.score ?? 0);
      return (a.module?.code ?? '').localeCompare(b.module?.code ?? '');
    });

    if (!query) return sorted;
    return sorted.filter((grade) => {
      const code = grade.module?.code?.toLowerCase() ?? '';
      const name = grade.module?.name?.toLowerCase() ?? '';
      return code.includes(query) || name.includes(query) || `${grade.score ?? ''}`.includes(query);
    });
  }, [gradeQuery, gradeSort, grades]);

  const handleSaveStudent = async () => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/students/${id}`, { method: 'PUT', body: studentForm });
      setMessage('Student updated.');
      setEditingStudent(false);
      await fetchData();
      setOperationRefresh((prev) => prev + 1);
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
      setOperationRefresh((prev) => prev + 1);
      navigate('/students');
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
      setEditingRegistrationId(null);
      await fetchData();
      setOperationRefresh((prev) => prev + 1);
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
      setOperationRefresh((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete registration');
    } finally {
      setSubmitting(false);
    }
  };

  const saveGrade = async () => {
    if (!id || !gradeForm.moduleId) {
      showGradeError('Select a module to save a grade.');
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
      setEditingGradeId(null);
      await fetchData();
      setOperationRefresh((prev) => prev + 1);
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
      setOperationRefresh((prev) => prev + 1);
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
        { key: 'overview', label: 'Overview', path: `/students/${id}` },
        { key: 'registrations', label: 'Registrations', path: `/students/${id}/registrations` },
        { key: 'grades', label: 'Grades', path: `/students/${id}/grades` },
      ].map((tab) => (
        <Link
          key={tab.key}
          to={tab.path}
          className={`icon-button compact ${activeSection === tab.key ? 'accent' : ''}`}
        >
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
        'Reopen the Add Grade form and confirm the selected module and score.',
        'Make sure your session is still active before retrying.',
        'If the issue keeps happening, refresh the page and try again.',
      ],
    });
  };

  const openRegistrationEditor = (registration?: Registration) => {
    if (registration) {
      setRegistrationForm({ id: registration.id, moduleId: registration.module?.id?.toString() ?? '' });
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
        moduleId: grade.module?.id?.toString() ?? '',
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
              <h3 className="text-lg font-semibold">Assign this student to a module</h3>
            </div>
            <button type="button" onClick={closeRegistrationModal} className="icon-button compact text-[10px] px-2 py-1" aria-label="Close registration editor">
              <span aria-hidden>✖️</span>
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-sm opacity-80" htmlFor="moduleId">Module</label>
            <select
              id="moduleId"
              value={registrationForm.moduleId}
              onChange={(e) => setRegistrationForm({ ...registrationForm, moduleId: e.target.value })}
              className="field"
            >
              <option value="">Select a module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.code} — {module.name}
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
            <label className="text-sm opacity-80" htmlFor="gradeModule">Module</label>
            <select
              id="gradeModule"
              value={gradeForm.moduleId}
              onChange={(e) => setGradeForm({ ...gradeForm, moduleId: e.target.value })}
              className="field"
            >
              <option value="">Select a module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.code} — {module.name}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <label className="text-sm opacity-80" htmlFor="score">Score</label>
              <input
                id="score"
                type="number"
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                className="field"
                placeholder="75"
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
      <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Student profile</p>
            <h2 className="text-xl font-semibold text-white">Personal details</h2>
          </div>
          <button
            type="button"
            className="icon-button accent px-4 py-2 text-sm"
            onClick={() =>
              requireAuth(() => {
                setStudentForm(student ?? emptyStudent);
                setEditingStudent((prev) => !prev);
              })
            }
            aria-label="Edit student"
          >
            <span aria-hidden>{editingStudent ? '✖️' : '✏️'}</span>
            <span>{editingStudent ? 'Close' : 'Edit'}</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="info-row">
            <span className="info-label">First name</span>
            {editingStudent ? (
              <input
                id="firstName"
                value={studentForm.firstName}
                onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                className="field max-w-sm"
              />
            ) : (
              <span className="info-value">{student?.firstName}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Last name</span>
            {editingStudent ? (
              <input
                id="lastName"
                value={studentForm.lastName}
                onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                className="field max-w-sm"
              />
            ) : (
              <span className="info-value">{student?.lastName}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Username</span>
            {editingStudent ? (
              <input
                id="userName"
                value={studentForm.userName}
                onChange={(e) => setStudentForm({ ...studentForm, userName: e.target.value })}
                className="field max-w-sm"
              />
            ) : (
              <span className="info-value">{student?.userName}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            {editingStudent ? (
              <input
                id="email"
                type="email"
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                className="field max-w-sm"
              />
            ) : (
              <span className="info-value">{student?.email}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Major</span>
            {editingStudent ? (
              <input
                id="major"
                value={studentForm.major ?? ''}
                onChange={(e) => setStudentForm({ ...studentForm, major: e.target.value })}
                className="field max-w-sm"
              />
            ) : (
              <span className="info-value">{student?.major || '—'}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Entry year</span>
            {editingStudent ? (
              <input
                id="entryYear"
                type="number"
                value={studentForm.entryYear ?? ''}
                onChange={(e) => setStudentForm({ ...studentForm, entryYear: toNumberOrNull(e.target.value) })}
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">{student?.entryYear ?? '—'}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Graduate year</span>
            {editingStudent ? (
              <input
                id="graduateYear"
                type="number"
                value={studentForm.graduateYear ?? ''}
                onChange={(e) => setStudentForm({ ...studentForm, graduateYear: toNumberOrNull(e.target.value) })}
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">{student?.graduateYear ?? '—'}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Birth date</span>
            {editingStudent ? (
              <input
                id="birthDate"
                type="date"
                value={studentForm.birthDate ?? ''}
                onChange={(e) => setStudentForm({ ...studentForm, birthDate: e.target.value || null })}
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">{student?.birthDate || '—'}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Sex</span>
            {editingStudent ? (
              <input
                id="sex"
                value={studentForm.sex ?? ''}
                onChange={(e) => setStudentForm({ ...studentForm, sex: e.target.value })}
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">{student?.sex || '—'}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Residency</span>
            {editingStudent ? (
              <select
                id="homeStudent"
                value={studentForm.homeStudent == null ? '' : String(studentForm.homeStudent)}
                onChange={(e) => setStudentForm({ ...studentForm, homeStudent: toBooleanOrNull(e.target.value) })}
                className="field max-w-xs"
              >
                <option value="">Select</option>
                <option value="true">Home student</option>
                <option value="false">International</option>
              </select>
            ) : (
              <span className="info-value">
                {student?.homeStudent == null ? '—' : student.homeStudent ? 'Home student' : 'International'}
              </span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Tuition fee</span>
            {editingStudent ? (
              <input
                id="tuitionFee"
                type="number"
                step="0.01"
                value={studentForm.tuitionFee ?? ''}
                onChange={(e) => setStudentForm({ ...studentForm, tuitionFee: toNumberOrNull(e.target.value) })}
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">{formatCurrency(student?.tuitionFee)}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Paid tuition</span>
            {editingStudent ? (
              <input
                id="paidTuitionFee"
                type="number"
                step="0.01"
                value={studentForm.paidTuitionFee ?? ''}
                onChange={(e) => setStudentForm({ ...studentForm, paidTuitionFee: toNumberOrNull(e.target.value) })}
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">{formatCurrency(student?.paidTuitionFee)}</span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Student ID</span>
            <span className="info-value">{student?.id}</span>
          </div>
        </div>

        {editingStudent && (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => requireAuth(handleSaveStudent)}
              disabled={submitting}
              className="icon-button accent"
              aria-label="Save student"
            >
              <span aria-hidden>💾</span>
              <span className="sr-only">Save student</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingStudent(false);
                setStudentForm(student ?? emptyStudent);
              }}
              className="icon-button text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => requireAuth(handleDeleteStudent)}
              className="icon-button danger"
              aria-label="Delete student"
            >
              <span aria-hidden>🗑️</span>
              <span className="sr-only">Delete student</span>
            </button>
          </div>
        )}

        {!editingStudent && (
          <div className="mt-5 grid items-stretch gap-4 sm:grid-cols-3">
            <div className="surface-card flex h-full flex-col gap-2 rounded-2xl p-5 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Average</p>
              <p className="text-2xl font-semibold text-white break-words leading-snug">{averageScore}</p>
              <p className="text-sm text-slate-300 leading-relaxed break-words">Across {grades.length || 'no'} recorded grades.</p>
            </div>
            <div className="surface-card flex h-full flex-col gap-2 rounded-2xl p-5 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Outstanding</p>
              <p className="text-2xl font-semibold text-white break-words leading-snug">{formatCurrency(outstandingTuition)}</p>
              <p className="text-sm text-slate-300 leading-relaxed break-words">Remaining from total tuition.</p>
            </div>
            <div className="surface-card flex h-full flex-col gap-2 rounded-2xl p-5 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Residency</p>
              <p className="text-2xl font-semibold text-white break-words leading-snug">{residencyLabel}</p>
              <p className="text-sm text-slate-300 leading-relaxed break-words">Used for fee calculations.</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white">Registrations</h3>
            <div className="flex flex-wrap gap-2">
              <Link to={`/students/${id}/registrations`} className="icon-button text-xs">
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
                className="flex items-center justify-between rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
              >
                <div>
                  <p className="text-sm text-slate-200">{registration.module?.code ?? 'Module'}</p>
                  <p className="text-xs text-slate-400">{registration.module?.name}</p>
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
            {!registrations.length && <p className="text-sm text-slate-300">No registrations yet.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">Grades</h3>
              <span className="pill bg-white/10 text-xs">Avg grade: {averageScore}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/students/${id}/grades`} className="icon-button text-xs">
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
                className="flex items-center justify-between rounded-2xl bg-black/30 p-3 ring-1 ring-white/10"
              >
                <div>
                  <p className="text-sm text-slate-200">{grade.module?.code ?? 'Module'} — {grade.score ?? '—'}</p>
                  <p className="text-xs text-slate-400">{grade.module?.name}</p>
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
            {!grades.length && <p className="text-sm text-slate-300">No grades recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegistrationsPage = () => (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">All registrations</p>
          <h2 className="text-xl font-semibold text-white">Modules this student attends</h2>
          <p className="text-sm text-slate-300">Filter, edit, or remove module registrations in one place.</p>
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
          placeholder="Search by module name or code"
          value={registrationQuery}
          onChange={(e) => setRegistrationQuery(e.target.value)}
        />
        <select
          value={registrationSort}
          onChange={(e) => setRegistrationSort(e.target.value as typeof registrationSort)}
          className="rounded-full bg-black/40 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10"
        >
          <option value="code">Module code</option>
          <option value="name">Module name</option>
          <option value="id">Registration ID</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 explorer-grid">
        {filteredRegistrations.map((registration) => (
          <div key={registration.id} className="surface-card explorer-card flex flex-col gap-3 p-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0 space-y-1 break-words">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{registration.module?.code ?? 'Module'}</p>
                <p className="text-lg font-semibold text-white">{registration.module?.name ?? 'Unknown module'}</p>
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
        {!filteredRegistrations.length && (
          <p className="text-sm text-slate-300">No registrations match your search.</p>
        )}
      </div>
    </div>
  );

  const renderGradesPage = () => (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">All grades</p>
          <h2 className="text-xl font-semibold text-white">Assessments for this student</h2>
          <p className="text-sm text-slate-300">Review every module score, adjust them, or add new marks.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="pill bg-white/10 text-xs">Average {averageScore}</span>
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
          placeholder="Search by module or score"
          value={gradeQuery}
          onChange={(e) => setGradeQuery(e.target.value)}
        />
        <select
          value={gradeSort}
          onChange={(e) => setGradeSort(e.target.value as typeof gradeSort)}
          className="rounded-full bg-black/40 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10"
        >
          <option value="module">Module code</option>
          <option value="scoreDesc">Score: high to low</option>
          <option value="scoreAsc">Score: low to high</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 explorer-grid">
        {filteredGrades.map((grade) => (
          <div key={grade.id} className="surface-card explorer-card flex flex-col gap-3 p-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0 space-y-1 break-words">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{grade.module?.code ?? 'Module'}</p>
                <p className="text-lg font-semibold text-white">{grade.module?.name ?? 'Unknown module'}</p>
                <p className="text-2xl font-semibold text-white">Score: {grade.score ?? '—'}</p>
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
        {!filteredGrades.length && <p className="text-sm text-slate-300">No grades match your search.</p>}
      </div>
    </div>
  );

  if (!id) {
    return (
      <div className="glass-panel">
        <div className="p-8 text-white">No student ID provided.</div>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-6 p-6 sm:gap-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Student detail</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Profile and records</h1>
            <p className="text-slate-200/80">Update this student, manage registrations, and maintain grades.</p>
            {renderSectionTabs()}
          </div>
          <Link
            to="/students"
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/20 hover:bg-white/20"
          >
            Back to students
          </Link>
        </div>

        {loading && <p className="text-slate-200">Loading…</p>}
        {error && (
          <ErrorMessage
            message={error}
            title="Student data error"
            tips={[
              'Ensure the student still exists or return to the student list.',
              'Refresh the page if your session timed out while editing.',
              'Retry after signing back in if you recently changed access.',
            ]}
          />
        )}
        {message && <p className="text-sm text-emerald-300">{message}</p>}

        {student && activeSection === 'overview' && renderOverview()}
        {student && activeSection === 'registrations' && renderRegistrationsPage()}
        {student && activeSection === 'grades' && renderGradesPage()}
        <OperationLogPanel refreshToken={operationRefresh} onReverted={() => void fetchData()} />
        {renderRegistrationModal()}
        {renderGradeModal()}
      </div>
    </div>
  );
};

export default StudentDetail;

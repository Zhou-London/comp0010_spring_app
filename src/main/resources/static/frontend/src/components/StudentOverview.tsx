import { type FC, useState } from 'react';
import type {
  Student,
  Grade,
  Registration,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, EditIcon, TrashIcon } from '../components/Icons';
import {
  apiFetch,
  formatCurrency,
  toBooleanOrNull,
  toNumberOrNull,
} from '../api';
import { Link, useNavigate } from 'react-router-dom';

interface StudentOverviewProps {
  student: Student;
  grades: Grade[];
  registrations: Registration[];
  onDataChange: () => void;
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

const StudentOverview: FC<StudentOverviewProps> = ({
  student,
  grades,
  registrations,
  onDataChange,
}) => {
  const { requireAuth } = useAuth();
  const navigate = useNavigate();
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState<Student>(student);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const averageScore =
    grades.length > 0
      ? (
          grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0) /
          grades.length
        ).toFixed(1)
      : '–';

  const outstandingTuition =
    student.tuitionFee != null
      ? (student.tuitionFee - (student.paidTuitionFee ?? 0)).toFixed(2)
      : null;

  const residencyLabel =
    student.homeStudent == null
      ? '—'
      : student.homeStudent
        ? 'Home student'
        : 'International';

  const handleSaveStudent = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/students/${student.id}`, {
        method: 'PUT',
        body: studentForm,
      });
      setMessage('Student updated.');
      setEditingStudent(false);
      onDataChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!student.id) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/students/${student.id}`, { method: 'DELETE' });
      navigate('/students');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-panel p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.05em] text-secondary">
              Student profile
            </p>
            <h2 className="text-xl font-semibold text-primary">
              Personal details
            </h2>
          </div>
          <button
            type="button"
            className="icon-button accent"
            onClick={() =>
              requireAuth(() => {
                setStudentForm(student ?? emptyStudent);
                setEditingStudent((prev) => !prev);
              })
            }
            aria-label="Edit student"
          >
            {editingStudent ? (
              <PlusIcon className="h-5 w-5 transform rotate-45" />
            ) : (
              <EditIcon className="h-5 w-5" />
            )}
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
                onChange={(e) =>
                  setStudentForm({ ...studentForm, firstName: e.target.value })
                }
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
                onChange={(e) =>
                  setStudentForm({ ...studentForm, lastName: e.target.value })
                }
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
                onChange={(e) =>
                  setStudentForm({ ...studentForm, userName: e.target.value })
                }
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
                onChange={(e) =>
                  setStudentForm({ ...studentForm, email: e.target.value })
                }
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
                onChange={(e) =>
                  setStudentForm({ ...studentForm, major: e.target.value })
                }
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
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    entryYear: toNumberOrNull(e.target.value),
                  })
                }
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
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    graduateYear: toNumberOrNull(e.target.value),
                  })
                }
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">
                {student?.graduateYear ?? '—'}
              </span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Birth date</span>
            {editingStudent ? (
              <input
                id="birthDate"
                type="date"
                value={studentForm.birthDate ?? ''}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    birthDate: e.target.value || null,
                  })
                }
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
                onChange={(e) =>
                  setStudentForm({ ...studentForm, sex: e.target.value })
                }
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
                value={
                  studentForm.homeStudent == null
                    ? ''
                    : String(studentForm.homeStudent)
                }
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    homeStudent: toBooleanOrNull(e.target.value),
                  })
                }
                className="field max-w-xs"
              >
                <option value="">Select</option>
                <option value="true">Home student</option>
                <option value="false">International</option>
              </select>
            ) : (
              <span className="info-value">{residencyLabel}</span>
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
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    tuitionFee: toNumberOrNull(e.target.value),
                  })
                }
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">
                {formatCurrency(student?.tuitionFee)}
              </span>
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
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    paidTuitionFee: toNumberOrNull(e.target.value),
                  })
                }
                className="field max-w-xs"
              />
            ) : (
              <span className="info-value">
                {formatCurrency(student?.paidTuitionFee)}
              </span>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Student ID</span>
            <span className="info-value">{student?.id}</span>
          </div>
        </div>

        {editingStudent && (
          <div className="mt-5 flex flex-col gap-3">
            {message && <p className="text-emerald-400 text-sm font-medium">{message}</p>}
            {error && <p className="text-rose-400 text-sm font-medium">{error}</p>}
            <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => requireAuth(handleSaveStudent)}
              disabled={submitting}
              className="icon-button accent"
              aria-label="Save student"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingStudent(false);
                setStudentForm(student ?? emptyStudent);
              }}
              className="icon-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => requireAuth(handleDeleteStudent)}
              className="icon-button danger"
              aria-label="Delete student"
            >
              <TrashIcon className="h-5 w-5" />
              <span>Delete</span>
            </button>
          </div>
        )}

        {!editingStudent && (
          <div className="mt-5 grid items-stretch gap-4 sm:grid-cols-3">
            <div className="surface-card flex h-full flex-col gap-2 p-5">
              <p className="text-xs uppercase tracking-[0.05em] text-secondary">
                Average
              </p>
              <p className="text-2xl font-semibold text-primary break-words leading-snug">
                {averageScore}
              </p>
              <p className="text-sm text-secondary leading-relaxed break-words">
                Across {grades.length || 'no'} recorded grades.
              </p>
            </div>
            <div className="surface-card flex h-full flex-col gap-2 p-5">
              <p className="text-xs uppercase tracking-[0.05em] text-secondary">
                Outstanding
              </p>
              <p className="text-2xl font-semibold text-primary break-words leading-snug">
                {formatCurrency(Number(outstandingTuition))}
              </p>
              <p className="text-sm text-secondary leading-relaxed break-words">
                Remaining from total tuition.
              </p>
            </div>
            <div className="surface-card flex h-full flex-col gap-2 p-5">
              <p className="text-xs uppercase tracking-[0.05em] text-secondary">
                Residency
              </p>
              <p className="text-2xl font-semibold text-primary break-words leading-snug">
                {residencyLabel}
              </p>
              <p className="text-sm text-secondary leading-relaxed break-words">
                Used for fee calculations.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-primary">Registrations</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/students/${student.id}/registrations`}
                className="icon-button"
              >
                Read more
              </Link>
            </div>
          </div>
          <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="surface-card flex items-center justify-between p-3"
              >
                <div>
                  <p className="text-sm text-primary">
                    {registration.module?.code ?? 'Module'}
                  </p>
                  <p className="text-xs text-secondary">
                    {registration.module?.name}
                  </p>
                </div>
              </div>
            ))}
            {!registrations.length && (
              <p className="text-sm text-secondary">No registrations yet.</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-primary">Grades</h3>
              <span className="pill text-xs">Avg grade: {averageScore}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/students/${student.id}/grades`}
                className="icon-button"
              >
                Read more
              </Link>
            </div>
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
            {grades.map((grade) => (
              <div
                key={grade.id}
                className="surface-card flex items-center justify-between p-3"
              >
                <div>
                  <p className="text-sm text-primary">
                    {grade.module?.code ?? 'Module'} — {grade.score ?? '—'}
                  </p>
                  <p className="text-xs text-secondary">
                    {grade.module?.name}
                  </p>
                </div>
              </div>
            ))}
            {!grades.length && (
              <p className="text-sm text-secondary">No grades recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;

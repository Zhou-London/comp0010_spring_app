import { type FC, useState } from 'react';
import type {
  Module,
  Grade,
  Registration,
  ModuleStatistics,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, EditIcon, TrashIcon } from '../components/Icons';
import { apiFetch } from '../api';
import { Link, useNavigate } from 'react-router-dom';

interface ModuleOverviewProps {
  module: Module;
  moduleStats: ModuleStatistics | null;
  grades: Grade[];
  registrations: Registration[];
  onDataChange: () => void;
}

const emptyModule: Module = {
  code: '',
  name: '',
  mnc: false,
  department: '',
};

const ModuleOverview: FC<ModuleOverviewProps> = ({
  module,
  moduleStats,
  grades,
  registrations,
  onDataChange,
}) => {
  const { requireAuth } = useAuth();
  const navigate = useNavigate();
  const [editingModule, setEditingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState<Module>(module);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const averageGrade =
    moduleStats?.averageGrade != null
      ? moduleStats.averageGrade.toFixed(1)
      : '–';

  const selectionRate = moduleStats
    ? `${(moduleStats.selectionRate * 100).toFixed(1)}%`
    : '–';

  const passRate =
    moduleStats?.passRate != null
      ? `${(moduleStats.passRate * 100).toFixed(1)}%`
      : '–';

  const handleSaveModule = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/modules/${module.id}`, {
        method: 'PUT',
        body: moduleForm,
      });
      setMessage('Module updated.');
      setEditingModule(false);
      onDataChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!module.id) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/modules/${module.id}`, { method: 'DELETE' });
      navigate('/modules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete module');
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
              Module profile
            </p>
            <h2 className="text-xl font-semibold text-primary">
              Module details
            </h2>
          </div>
          <button
            type="button"
            className="icon-button accent"
            onClick={() =>
              requireAuth(() => {
                setModuleForm(module ?? emptyModule);
                setEditingModule((prev) => !prev);
              })
            }
            aria-label="Edit module"
          >
            {editingModule ? (
              <PlusIcon className="h-5 w-5 transform rotate-45" />
            ) : (
              <EditIcon className="h-5 w-5" />
            )}
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
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, code: e.target.value })
                }
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
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, name: e.target.value })
                }
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
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    department: e.target.value,
                  })
                }
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
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, mnc: e.target.checked })
                  }
                  className="h-4 w-4 rounded text-accent focus:ring-accent"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                  }}
                />
                <span className="text-secondary">Mandatory module</span>
              </label>
            ) : (
              <span className="info-value">
                {module?.mnc ? 'Mandatory' : 'Elective'}
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
          <div className="mt-5 flex flex-col gap-3">
             {message && <p className="text-emerald-400 text-sm font-medium">{message}</p>}
             {error && <p className="text-rose-400 text-sm font-medium">{error}</p>}
             <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => requireAuth(handleSaveModule)}
              disabled={submitting}
              className="icon-button accent"
              aria-label="Save module"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingModule(false);
                setModuleForm(module ?? emptyModule);
              }}
              className="icon-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => requireAuth(handleDeleteModule)}
              className="icon-button danger"
              aria-label="Delete module"
            >
              <TrashIcon className="h-5 w-5" />
              <span>Delete</span>
            </button>
          </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-primary">
              Registrations
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/modules/${module.id}/registrations`}
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
                    {registration.student?.userName ?? 'Student'}
                  </p>
                  <p className="text-xs text-secondary">
                    {registration.student?.email}
                  </p>
                </div>
              </div>
            ))}
            {!registrations.length && (
              <p className="text-sm text-secondary">
                No registrations recorded yet.
              </p>
            )}
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
              <Link
                to={`/modules/${module.id}/grades`}
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
                    {grade.student?.userName ?? 'Student'} —{' '}
                    {grade.score ?? '—'}
                  </p>
                  <p className="text-xs text-secondary">
                    {grade.student?.email}
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

export default ModuleOverview;

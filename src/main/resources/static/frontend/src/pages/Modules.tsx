import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { type Grade, type Module } from '../types';

const emptyModule: Module = {
  code: '',
  name: '',
  mnc: false,
  requiredYear: null,
  prerequisite: null,
};

const Modules = () => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();

  const [modules, setModules] = useState<Module[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [moduleQuery, setModuleQuery] = useState('');
  const [moduleSort, setModuleSort] = useState<'codeAsc' | 'codeDesc' | 'nameAsc'>('codeAsc');

  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState<Module>(emptyModule);
  const [submitting, setSubmitting] = useState(false);
  const [savingError, setSavingError] = useState('');
  const [savingMessage, setSavingMessage] = useState('');

  const fetchModules = async () => {
    setLoading(true);
    setError('');
    try {
      const [modulesResponse, gradesResponse] = await Promise.all([
        apiFetch<CollectionResponse<Module>>('/modules'),
        apiFetch<CollectionResponse<Grade>>('/grades'),
      ]);

      setModules(unwrapCollection(modulesResponse, 'modules'));
      setGrades(unwrapCollection(gradesResponse, 'grades'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchModules();
  }, []);

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

  const openModuleModal = () => {
    setModuleForm(emptyModule);
    setSavingError('');
    setSavingMessage('');
    setModuleFormOpen(true);
  };

  const saveModule = async () => {
    setSubmitting(true);
    setSavingError('');
    setSavingMessage('');
    try {
      const payload = {
        ...moduleForm,
        requiredYear: moduleForm.requiredYear ?? null,
        minAllowedYear: moduleForm.minAllowedYear ?? null,
        maxAllowedYear: moduleForm.maxAllowedYear ?? null,
        prerequisite:
          moduleForm.prerequisite && moduleForm.prerequisite.id
            ? { id: moduleForm.prerequisite.id }
            : null,
      };
      await apiFetch('/modules', { method: 'POST', body: payload });
      setSavingMessage('Module created.');
      setModuleFormOpen(false);
      setModuleForm(emptyModule);
      await fetchModules();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const renderModuleCard = (module: Module) => {
    const stats = module.id ? moduleAverages.get(module.id) : undefined;
    const average = stats ? (stats.sum / stats.count).toFixed(1) : '–';
    const prereqLabel = module.prerequisite?.code
      ? `Prereq: ${module.prerequisite.code}`
      : 'No prerequisite';
    const yearRange =
      module.minAllowedYear || module.maxAllowedYear
        ? `${module.minAllowedYear ?? 1} - ${module.maxAllowedYear ?? '∞'}`
        : module.requiredYear
          ? `Year ${module.requiredYear}+`
          : 'All years';

    return (
      <button
        key={`${module.code}-${module.name}`}
        type="button"
        onClick={() => module.id && navigate(`/modules/${module.id}`)}
        className="surface-card explorer-card group flex h-full flex-col gap-3 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">{module.code}</p>
          <span className="pill shrink-0 whitespace-nowrap">ID: {module.id ?? '–'}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-semibold text-white">{module.name}</p>
          <p className="text-sm text-slate-300">Average grade · {average}</p>
          <p className="text-xs text-slate-400">
            {prereqLabel} · {yearRange}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Modules</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Search, sort, and open modules</h1>
          <p className="text-slate-200/80">
            View the catalogue with filters and sorting, jump into detail pages, and add new modules from one focused space.
          </p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            title="Unable to load modules"
            tips={[
              'Check your network connection and refresh the page.',
              'Confirm the server is running and reachable.',
              'If the problem continues, try signing in again before retrying.',
            ]}
          />
        )}

        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Modules</h2>
              <p className="text-sm text-slate-300">Scroll, search, and open module records.</p>
            </div>
            <button
              type="button"
              onClick={() => requireAuth(() => {
                if (!moduleFormOpen) openModuleModal();
                else setModuleFormOpen(false);
              })}
              className="icon-button accent text-xs"
              aria-label="Add module"
            >
              <span aria-hidden>{moduleFormOpen ? '—' : '➕'}</span>
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
          {moduleFormOpen && (
            <div className="mt-4 space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={moduleForm.code}
                  onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
                  className="field"
                  placeholder="Module code"
                />
                <input
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  className="field"
                  placeholder="Module name"
                />
                <input
                  type="number"
                  min={1}
                  value={moduleForm.requiredYear ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModuleForm({ ...moduleForm, requiredYear: val ? Number(val) : null });
                  }}
                  className="field"
                  placeholder="Required year (optional)"
                />
                <select
                  value={moduleForm.prerequisite?.id ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const prereq = val ? modules.find((m) => m.id === Number(val)) : null;
                    setModuleForm({ ...moduleForm, prerequisite: prereq ?? null });
                  }}
                  className="field"
                >
                  <option value="">No prerequisite</option>
                  {modules.map((module) => (
                    <option key={`prereq-${module.id}`} value={module.id}>
                      {module.code} — {module.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={moduleForm.minAllowedYear ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModuleForm({ ...moduleForm, minAllowedYear: val ? Number(val) : null });
                  }}
                  className="field"
                  placeholder="Min allowed year (optional)"
                />
                <input
                  type="number"
                  min={1}
                  value={moduleForm.maxAllowedYear ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModuleForm({ ...moduleForm, maxAllowedYear: val ? Number(val) : null });
                  }}
                  className="field"
                  placeholder="Max allowed year (optional)"
                />
                <label className="flex items-center gap-3 sm:col-span-2 rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">
                  <input
                    type="checkbox"
                    checked={moduleForm.mnc}
                    onChange={(e) => setModuleForm({ ...moduleForm, mnc: e.target.checked })}
                    className="h-5 w-5 rounded border-white/30 bg-white/10 text-sky-400 focus:ring-white/40"
                  />
                  <span className="text-slate-200">Mandatory module</span>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => requireAuth(saveModule)}
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
                    setModuleFormOpen(false);
                    setModuleForm(emptyModule);
                    setSavingError('');
                    setSavingMessage('');
                  }}
                  className="icon-button text-xs"
                >
                  Cancel
                </button>
              </div>
              {savingMessage && <span className="text-sm text-emerald-300">{savingMessage}</span>}
              {savingError && (
                <ErrorMessage
                  message={savingError}
                  title="Module save failed"
                  tips={[
                    'Ensure the module code and name are filled in without duplicates.',
                    'Verify you are signed in with permission to create modules.',
                    'Try saving again after refreshing if the issue persists.',
                  ]}
                />
              )}
            </div>
          )}

          <div className="mt-4 grid max-h-[32rem] gap-3 overflow-auto pr-2 explorer-grid">
            {filteredModules.map(renderModuleCard)}
            {!loading && !filteredModules.length && <p className="text-slate-300">No modules match that search.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modules;

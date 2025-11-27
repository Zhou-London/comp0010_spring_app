import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection } from '../api';
import { type HalCollection, type Module } from '../types';

const emptyForm: Module = {
  code: '',
  name: '',
  mnc: false,
};

const Modules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [form, setForm] = useState<Module>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchModules = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<HalCollection<Module>>('/modules');
      setModules(unwrapCollection(response, 'modules'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await apiFetch('/modules', {
        method: 'POST',
        body: form,
      });
      setForm(emptyForm);
      setMessage('Module saved successfully.');
      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const total = useMemo(() => modules.length, [modules]);

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Modules</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Module library</h1>
          <p className="text-slate-200/80">Store module codes, friendly names, and whether they are mandatory.</p>
          <div className="pill inline-flex w-fit items-center gap-2 bg-white/10 text-xs font-semibold text-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-300"></span>
            {total} curated modules
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Current set</h2>
              <button
                type="button"
                onClick={fetchModules}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="mt-4 text-slate-300">Loading modules…</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {modules.map((module) => (
                  <div
                    key={`${module.code}-${module.name}`}
                    className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10 shadow-sm shadow-black/40"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{module.code}</p>
                    <p className="text-lg font-semibold text-white">{module.name}</p>
                    <p className="text-sm text-slate-300">{module.mnc ? 'Mandatory' : 'Elective'}</p>
                  </div>
                ))}
                {modules.length === 0 && (
                  <p className="text-slate-300">No modules added yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white">Add a module</h2>
            <p className="text-sm text-slate-300">Mirrors the Module model. Password travels automatically.</p>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="code">Module code</label>
                <input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  className="field"
                  placeholder="COMP0010"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="name">Module name</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="field"
                  placeholder="Software Engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="mnc">Mandatory?</label>
                <div className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10">
                  <input
                    id="mnc"
                    type="checkbox"
                    checked={form.mnc}
                    onChange={(e) => setForm({ ...form, mnc: e.target.checked })}
                    className="h-5 w-5 rounded border-white/30 bg-white/10 text-sky-400 focus:ring-white/40"
                  />
                  <span className="text-slate-200">Toggle if core to the programme.</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-white/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : 'Save module'}
              </button>
              {message && <p className="text-sm text-emerald-300">{message}</p>}
              {error && <p className="text-sm text-rose-300">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modules;

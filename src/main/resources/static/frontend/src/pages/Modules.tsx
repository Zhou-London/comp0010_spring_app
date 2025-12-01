import { type FormEvent, useState } from 'react';
import { apiFetch } from '../api';
import { type Module } from '../types';

const emptyForm: Module = {
  code: '',
  name: '',
  mnc: false,
};

const Modules = () => {
  const [form, setForm] = useState<Module>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save module');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Modules</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Manage modules</h1>
          <p className="text-slate-200/80">
            Create and flag modules for programmes. Explore the existing library on the read-only Summary or Explorer pages.
          </p>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <h2 className="text-lg font-semibold text-white">Add a module</h2>
          <p className="text-sm text-slate-300">
            Mirrors the Module model. Password travels automatically. Browse all modules on the dedicated read-only pages.
          </p>
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
  );
};

export default Modules;

import { type FormEvent, useState } from 'react';
import { apiFetch } from '../api';
import { type Student } from '../types';

const emptyForm: Student = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
};

const Students = () => {
  const [form, setForm] = useState<Student>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await apiFetch('/students', {
        method: 'POST',
        body: form,
      });
      setForm(emptyForm);
      setMessage('Student saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Students</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Manage student records</h1>
          <p className="text-slate-200/80">
            Add new students or adjust existing profiles. A read-only catalogue now lives on the Summary and Explorer pages.
          </p>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <h2 className="text-lg font-semibold text-white">Create a student</h2>
          <p className="text-sm text-slate-300">
            Fields mirror the API model. Password is added automatically. To browse the directory, head to the Summary or Explorer page.
          </p>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="firstName">First name</label>
              <input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                className="field"
                placeholder="Ada"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
                className="field"
                placeholder="Lovelace"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="userName">Username</label>
              <input
                id="userName"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                required
                className="field"
                placeholder="ada.l"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="field"
                placeholder="ada@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-white/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Save student'}
            </button>
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {error && <p className="text-sm text-rose-300">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Students;

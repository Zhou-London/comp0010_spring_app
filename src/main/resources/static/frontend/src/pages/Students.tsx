import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Student } from '../types';

const emptyForm: Student = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
};

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [gpaMap, setGpaMap] = useState<Record<number, number>>({});
  const [form, setForm] = useState<Student>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<CollectionResponse<Student>>('/students');
      setStudents(unwrapCollection(response, 'students'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!students.length) {
      setGpaMap({});
      return;
    }

    const loadGpa = async () => {
      const entries = await Promise.all(
        students
          .filter((student) => student.id !== undefined && student.id !== null)
          .map(async (student) => {
            try {
              const response = await apiFetch<{ gpa: number }>(`/students/${student.id}/gpa`);
              return [student.id as number, response.gpa] as const;
            } catch (err) {
              console.error('Failed to load GPA for student', student.id, err);
              return [student.id as number, NaN] as const;
            }
          }),
      );

      const map: Record<number, number> = {};
      entries.forEach(([id, gpa]) => {
        map[id] = gpa;
      });
      setGpaMap(map);
    };

    void loadGpa();
  }, [students]);

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
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const total = useMemo(() => students.length, [students]);

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Students</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">People directory</h1>
          <p className="text-slate-200/80">Capture student profiles with crisp identifiers and contact details.</p>
          <div className="pill inline-flex w-fit items-center gap-2 bg-white/10 text-xs font-semibold text-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
            {total} on record
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Latest entries</h2>
              <button
                type="button"
                onClick={fetchStudents}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="mt-4 text-slate-300">Loading students…</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {students.map((student) => (
                  <div
                    key={`${student.userName}-${student.email}`}
                    className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10 shadow-sm shadow-black/40"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{student.userName}</p>
                    <p className="text-lg font-semibold text-white">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-slate-300">{student.email}</p>
                    {student.id !== undefined && (
                      <p className="text-sm text-emerald-300 mt-1">
                        GPA: {Number.isNaN(gpaMap[student.id]) || gpaMap[student.id] === undefined ? '—' : gpaMap[student.id].toFixed(2)}
                      </p>
                    )}
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-slate-300">No students recorded yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white">Add a student</h2>
            <p className="text-sm text-slate-300">Fields mirror the API model. Password is added automatically.</p>
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
    </div>
  );
};

export default Students;

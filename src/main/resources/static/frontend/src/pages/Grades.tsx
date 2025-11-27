import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade } from '../types';

const emptyForm = {
  studentId: '',
  moduleId: '',
  score: '',
};

const Grades = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchGrades = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<CollectionResponse<Grade>>('/grades');
      setGrades(unwrapCollection(response, 'grades'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await apiFetch('/grades/upsert', {
        method: 'POST',
        body: {
          studentId: Number(form.studentId),
          moduleId: Number(form.moduleId),
          score: Number(form.score),
        },
      });
      setForm(emptyForm);
      setMessage('Grade upserted successfully.');
      await fetchGrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upsert grade');
    } finally {
      setSubmitting(false);
    }
  };

  const averageScore = useMemo(() => {
    if (!grades.length) return 0;
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return Math.round((total / grades.length) * 10) / 10;
  }, [grades]);

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Grades</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Scores and outcomes</h1>
          <p className="text-slate-200/80">Upsert grades using student + module identifiers. Password handled for you.</p>
          <div className="pill inline-flex w-fit items-center gap-2 bg-white/10 text-xs font-semibold text-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-300"></span>
            Avg score: {grades.length ? averageScore : '–'}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/40 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Recorded grades</h2>
              <button
                type="button"
                onClick={fetchGrades}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="mt-4 text-slate-300">Loading grades…</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {grades.map((grade) => (
                  <div
                    key={`${grade.id ?? ''}-${grade.student?.userName ?? grade.student?.id ?? ''}-${grade.module?.code ?? grade.module?.id ?? ''}`}
                    className="rounded-2xl bg-black/30 px-4 py-3 ring-1 ring-white/10 shadow-sm shadow-black/40"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">{grade.module?.code ?? 'Module'}</p>
                    <p className="text-lg font-semibold text-white">Score: {grade.score}</p>
                    <p className="text-sm text-slate-300">Student: {grade.student?.userName ?? grade.student?.id ?? 'Unknown'}</p>
                  </div>
                ))}
                {grades.length === 0 && (
                  <p className="text-slate-300">No grades recorded yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white">Upsert a grade</h2>
            <p className="text-sm text-slate-300">Provide student and module identifiers with a score (int).</p>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="studentId">Student ID</label>
                <input
                  id="studentId"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  required
                  className="field"
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="moduleId">Module ID</label>
                <input
                  id="moduleId"
                  value={form.moduleId}
                  onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                  required
                  className="field"
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-200" htmlFor="score">Score</label>
                <input
                  id="score"
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  required
                  className="field"
                  placeholder="95"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-white/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : 'Upsert grade'}
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

export default Grades;

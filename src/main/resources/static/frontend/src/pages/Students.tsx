import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import { type Grade, type Student } from '../types';

const emptyStudent: Student = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
};

const Students = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [studentQuery, setStudentQuery] = useState('');
  const [studentSort, setStudentSort] = useState<'nameAsc' | 'nameDesc' | 'id'>('nameAsc');

  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [studentForm, setStudentForm] = useState<Student>(emptyStudent);
  const [submitting, setSubmitting] = useState(false);
  const [savingError, setSavingError] = useState('');
  const [savingMessage, setSavingMessage] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsResponse, gradesResponse] = await Promise.all([
        apiFetch<CollectionResponse<Student>>('/students'),
        apiFetch<CollectionResponse<Grade>>('/grades'),
      ]);

      setStudents(unwrapCollection(studentsResponse, 'students'));
      setGrades(unwrapCollection(gradesResponse, 'grades'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStudents();
  }, []);

  const studentAverages = useMemo(() => {
    const totals = new Map<number, { sum: number; count: number }>();
    grades.forEach((grade) => {
      const studentId = grade.student?.id;
      if (!studentId || grade.score == null) return;
      const current = totals.get(studentId) ?? { sum: 0, count: 0 };
      totals.set(studentId, { sum: current.sum + grade.score, count: current.count + 1 });
    });
    return totals;
  }, [grades]);

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    const sorted = [...students].sort((a, b) => {
      if (studentSort === 'id') return (a.id ?? 0) - (b.id ?? 0);
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return studentSort === 'nameAsc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    if (!query) return sorted;
    return sorted.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return fullName.includes(query) || student.userName.toLowerCase().includes(query) || `${student.id ?? ''}`.includes(query);
    });
  }, [studentQuery, students, studentSort]);

  const openStudentModal = () => {
    setStudentForm(emptyStudent);
    setSavingError('');
    setSavingMessage('');
    setStudentFormOpen(true);
  };

  const handleSaveStudent = async () => {
    setSubmitting(true);
    setSavingError('');
    setSavingMessage('');
    try {
      await apiFetch('/students', { method: 'POST', body: studentForm });
      setSavingMessage('Student created.');
      setStudentFormOpen(false);
      setStudentForm(emptyStudent);
      await fetchStudents();
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : 'Unable to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStudentCard = (student: Student) => {
    const stats = student.id ? studentAverages.get(student.id) : undefined;
    const average = stats ? (stats.sum / stats.count).toFixed(1) : '–';

    return (
      <button
        key={`${student.userName}-${student.email}`}
        type="button"
        onClick={() => student.id && navigate(`/students/${student.id}`)}
        className="surface-card explorer-card group flex h-full flex-col gap-3 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">{student.userName}</p>
          <span className="pill shrink-0 whitespace-nowrap">ID: {student.id ?? '–'}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-semibold text-white">{student.firstName} {student.lastName}</p>
          <p className="text-sm text-slate-300">Average score · {average}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Students</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Search, sort, and open student records</h1>
          <p className="text-slate-200/80">
            Browse the directory with rich filters, open details in a click, and add new students without leaving this page.
          </p>
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-inner shadow-black/30 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Students</h2>
              <p className="text-sm text-slate-300">Searchable, sortable student directory.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!studentFormOpen) openStudentModal();
                else setStudentFormOpen(false);
              }}
              className="icon-button accent text-xs"
              aria-label="Add student"
            >
              <span aria-hidden>{studentFormOpen ? '—' : '➕'}</span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              className="field flex-1 min-w-[12rem]"
              placeholder="Search by name or ID"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
            />
            <select
              value={studentSort}
              onChange={(e) => setStudentSort(e.target.value as typeof studentSort)}
              className="rounded-full bg-black/40 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/10"
            >
              <option value="nameAsc">Name: A to Z</option>
              <option value="nameDesc">Name: Z to A</option>
              <option value="id">Student ID</option>
            </select>
          </div>
          {studentFormOpen && (
            <div className="mt-4 space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={studentForm.firstName}
                  onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                  className="field"
                  placeholder="First name"
                />
                <input
                  value={studentForm.lastName}
                  onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                  className="field"
                  placeholder="Last name"
                />
                <input
                  value={studentForm.userName}
                  onChange={(e) => setStudentForm({ ...studentForm, userName: e.target.value })}
                  className="field"
                  placeholder="Username"
                />
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="field"
                  placeholder="Email"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveStudent}
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
                    setStudentFormOpen(false);
                    setStudentForm(emptyStudent);
                    setSavingError('');
                    setSavingMessage('');
                  }}
                  className="icon-button text-xs"
                >
                  Cancel
                </button>
                {savingMessage && <span className="text-sm text-emerald-300">{savingMessage}</span>}
                {savingError && <span className="text-sm text-rose-300">{savingError}</span>}
              </div>
            </div>
          )}

          <div className="mt-4 grid max-h-[32rem] gap-3 overflow-auto pr-2 explorer-grid">
            {filteredStudents.map(renderStudentCard)}
            {!loading && !filteredStudents.length && <p className="text-slate-300">No students match that search.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;

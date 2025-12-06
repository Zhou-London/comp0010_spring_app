import { type FC, useMemo, useState } from 'react';
import type { Grade } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, EditIcon } from '../components/Icons';

interface StudentGradesProps {
  grades: Grade[];
  onAdd: () => void;
  onEdit: (grade: Grade) => void;
}

const StudentGrades: FC<StudentGradesProps> = ({
  grades,
  onAdd,
  onEdit,
}) => {
  const { requireAuth } = useAuth();
  const [gradeQuery, setGradeQuery] = useState('');
  const [gradeSort, setGradeSort] = useState<
    'module' | 'scoreDesc' | 'scoreAsc'
  >('module');

  const averageScore = useMemo(() => {
    if (!grades.length) return '–';
    const total = grades.reduce((acc, grade) => acc + (grade.score ?? 0), 0);
    return (total / grades.length).toFixed(1);
  }, [grades]);

  const filteredGrades = [...grades]
    .sort((a, b) => {
      if (gradeSort === 'scoreAsc') return (a.score ?? 0) - (b.score ?? 0);
      if (gradeSort === 'scoreDesc') return (b.score ?? 0) - (a.score ?? 0);
      return (a.module?.code ?? '').localeCompare(b.module?.code ?? '');
    })
    .filter((grade) => {
      const query = gradeQuery.trim().toLowerCase();
      if (!query) return true;
      const code = grade.module?.code?.toLowerCase() ?? '';
      const name = grade.module?.name?.toLowerCase() ?? '';
      return (
        code.includes(query) ||
        name.includes(query) ||
        `${grade.score ?? ''}`.includes(query)
      );
    });

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.05em] text-secondary">
            All grades
          </p>
          <h2 className="text-xl font-semibold text-primary">
            Assessments for this student
          </h2>
          <p className="text-sm text-secondary">
            Review every module score, adjust them, or add new marks.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="pill text-xs">Average {averageScore}</span>
          <button
            type="button"
            onClick={() => requireAuth(onAdd)}
            className="icon-button accent"
            aria-label="Add grade"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add grade</span>
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
          className="field text-sm"
        >
          <option value="module">Module code</option>
          <option value="scoreDesc">Score: high to low</option>
          <option value="scoreAsc">Score: low to high</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3">
        {filteredGrades.map((grade) => (
          <div key={grade.id} className="surface-card flex flex-col gap-3 p-5">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0 space-y-1 break-words">
                <p className="text-xs uppercase tracking-[0.05em] text-secondary">
                  {grade.module?.code ?? 'Module'}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {grade.module?.name ?? 'Unknown module'}
                </p>
                <p className="text-2xl font-semibold text-primary">
                  Score: {grade.score ?? '—'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="pill text-xs break-words">
                  ID: {grade.id ?? '—'}
                </span>
                <button
                  type="button"
                  onClick={() => requireAuth(() => onEdit(grade))}
                  className="icon-button"
                  aria-label="Edit grade"
                >
                  <EditIcon className="h-5 w-5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filteredGrades.length && (
          <p className="text-sm text-secondary">No grades match your search.</p>
        )}
      </div>
    </div>
  );
};

export default StudentGrades;

import { type FC, useState } from 'react';
import type { Grade, Module } from '../types';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

interface GradeFormProps {
  initialGrade?: Grade;
  modules: Module[];
  onSubmit: (grade: {
    id?: number;
    moduleId: string;
    score: string;
  }) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: number) => Promise<void>;
}

const GradeForm: FC<GradeFormProps> = ({
  initialGrade,
  modules,
  onSubmit,
  onCancel,
  onDelete,
}) => {
  const [moduleId, setModuleId] = useState(
    initialGrade?.module?.id?.toString() ?? '',
  );
  const [score, setScore] = useState(initialGrade?.score?.toString() ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [savingError, setSavingError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId || !score) {
      setSavingError('Please select a module and enter a score.');
      return;
    }
    setSubmitting(true);
    setSavingError('');
    try {
      await onSubmit({ id: initialGrade?.id, moduleId, score });
    } catch (err) {
      setSavingError(
        err instanceof Error ? err.message : 'Unable to save grade',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-3">
        <label className="text-sm text-secondary" htmlFor="gradeModule">
          Module
        </label>
        <select
          id="gradeModule"
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          className="field"
        >
          <option value="">Select a module</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.code} — {module.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-secondary" htmlFor="score">
          Score
        </label>
        <input
          id="score"
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="field"
          placeholder="75"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          isLoading={submitting}
          aria-label={initialGrade ? 'Update grade' : 'Save grade'}
        >
          Save
        </Button>
        {initialGrade?.id && onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(initialGrade.id!)}
            isLoading={submitting}
          >
            Delete
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {savingError && <ErrorMessage message={savingError} title="Save failed" />}
    </form>
  );
};

export default GradeForm;

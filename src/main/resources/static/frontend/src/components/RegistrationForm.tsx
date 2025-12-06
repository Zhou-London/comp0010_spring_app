import { type FC, useState } from 'react';
import type { Module, Registration } from '../types';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

interface RegistrationFormProps {
  initialRegistration?: Registration;
  modules: Module[];
  onSubmit: (registration: {
    id?: number;
    moduleId: string;
  }) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: number) => Promise<void>;
}

const RegistrationForm: FC<RegistrationFormProps> = ({
  initialRegistration,
  modules,
  onSubmit,
  onCancel,
  onDelete,
}) => {
  const [moduleId, setModuleId] = useState(
    initialRegistration?.module?.id?.toString() ?? '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [savingError, setSavingError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleId) {
      setSavingError('Please select a module.');
      return;
    }
    setSubmitting(true);
    setSavingError('');
    try {
      await onSubmit({ id: initialRegistration?.id, moduleId });
    } catch (err) {
      setSavingError(
        err instanceof Error ? err.message : 'Unable to save registration',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-3">
        <label className="text-sm text-secondary" htmlFor="moduleId">
          Module
        </label>
        <select
          id="moduleId"
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

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          isLoading={submitting}
          aria-label={
            initialRegistration ? 'Update registration' : 'Save registration'
          }
        >
          Save
        </Button>
        {initialRegistration?.id && onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(initialRegistration.id!)}
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

export default RegistrationForm;

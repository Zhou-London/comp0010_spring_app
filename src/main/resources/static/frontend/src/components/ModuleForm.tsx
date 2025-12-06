import { type FC, useState } from 'react';
import type { Module } from '../types';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

export const emptyModule: Module = {
  code: '',
  name: '',
  mnc: false,
  department: '',
};

interface ModuleFormProps {
  initialModule?: Module;
  onSubmit: (module: Module) => Promise<void>;
  onCancel: () => void;
}

const ModuleForm: FC<ModuleFormProps> = ({
  initialModule = emptyModule,
  onSubmit,
  onCancel,
}) => {
  const [moduleForm, setModuleForm] = useState<Module>(initialModule);
  const [submitting, setSubmitting] = useState(false);
  const [savingError, setSavingError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSavingError('');
    try {
      await onSubmit(moduleForm);
    } catch (err) {
      setSavingError(
        err instanceof Error ? err.message : 'Unable to save module',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={moduleForm.code}
          onChange={(e) =>
            setModuleForm({ ...moduleForm, code: e.target.value })
          }
          className="field"
          placeholder="Module code"
          required
        />
        <input
          value={moduleForm.name}
          onChange={(e) =>
            setModuleForm({ ...moduleForm, name: e.target.value })
          }
          className="field"
          placeholder="Module name"
          required
        />
        <input
          value={moduleForm.department}
          onChange={(e) =>
            setModuleForm({ ...moduleForm, department: e.target.value })
          }
          className="field"
          placeholder="Department"
        />
        <label className="flex items-center gap-3 sm:col-span-2 rounded-xl bg-input-bg px-4 py-3 border border-card-border">
          <input
            type="checkbox"
            checked={moduleForm.mnc}
            onChange={(e) =>
              setModuleForm({ ...moduleForm, mnc: e.target.checked })
            }
            className="h-4 w-4 rounded text-accent focus:ring-accent"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
            }}
          />
          <span className="text-secondary">Mandatory module</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={submitting} aria-label="Save module">
          Save Module
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {savingError && (
        <ErrorMessage
          message={savingError}
          title="Module save failed"
          tips={[
            'Ensure the module code and name are filled in without duplicates.',
            'Verify you are signed in with permission to create modules.',
            'Try saving again after refreshing if the issue persists.',
          ]}
          floating
        />
      )}
    </form>
  );
};

export default ModuleForm;

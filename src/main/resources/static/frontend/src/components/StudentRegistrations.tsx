import { type FC, useState } from 'react';
import type { Registration } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, EditIcon } from '../components/Icons';

interface StudentRegistrationsProps {
  registrations: Registration[];
  onAdd: () => void;
  onEdit: (registration: Registration) => void;
}

const StudentRegistrations: FC<StudentRegistrationsProps> = ({
  registrations,
  onAdd,
  onEdit,
}) => {
  const { requireAuth } = useAuth();
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationSort, setRegistrationSort] = useState<
    'code' | 'name' | 'id'
  >('code');

  const filteredRegistrations = [...registrations]
    .sort((a, b) => {
      if (registrationSort === 'id') return (a.id ?? 0) - (b.id ?? 0);
      if (registrationSort === 'name')
        return (a.module?.name ?? '').localeCompare(b.module?.name ?? '');
      return (a.module?.code ?? '').localeCompare(b.module?.code ?? '');
    })
    .filter((registration) => {
      const query = registrationQuery.trim().toLowerCase();
      if (!query) return true;
      const code = registration.module?.code?.toLowerCase() ?? '';
      const name = registration.module?.name?.toLowerCase() ?? '';
      return (
        code.includes(query) ||
        name.includes(query) ||
        `${registration.id ?? ''}`.includes(query)
      );
    });

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.05em] text-secondary">
            All registrations
          </p>
          <h2 className="text-xl font-semibold text-primary">
            Modules this student attends
          </h2>
          <p className="text-sm text-secondary">
            Filter, edit, or remove module registrations in one place.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => requireAuth(onAdd)}
            className="icon-button accent"
            aria-label="Add registration"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add registration</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className="field"
          placeholder="Search by module name or code"
          value={registrationQuery}
          onChange={(e) => setRegistrationQuery(e.target.value)}
        />
        <select
          value={registrationSort}
          onChange={(e) =>
            setRegistrationSort(e.target.value as typeof registrationSort)
          }
          className="field text-sm"
        >
          <option value="code">Module code</option>
          <option value="name">Module name</option>
          <option value="id">Registration ID</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3">
        {filteredRegistrations.map((registration) => (
          <div
            key={registration.id}
            className="surface-card flex flex-col gap-3 p-5"
          >
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0 space-y-1 break-words">
                <p className="text-xs uppercase tracking-[0.05em] text-secondary">
                  {registration.module?.code ?? 'Module'}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {registration.module?.name ?? 'Unknown module'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="pill text-xs break-words">
                  ID: {registration.id ?? '—'}
                </span>
                <button
                  type="button"
                  onClick={() => requireAuth(() => onEdit(registration))}
                  className="icon-button"
                  aria-label="Edit registration"
                >
                  <EditIcon className="h-5 w-5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filteredRegistrations.length && (
          <p className="text-sm text-secondary">
            No registrations match your search.
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentRegistrations;

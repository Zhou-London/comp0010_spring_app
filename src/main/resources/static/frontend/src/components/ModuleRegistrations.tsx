import { type FC, useState } from 'react';
import type { Registration } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, EditIcon } from '../components/Icons';

interface ModuleRegistrationsProps {
  registrations: Registration[];
  onAdd: () => void;
  onEdit: (registration: Registration) => void;
}

const ModuleRegistrations: FC<ModuleRegistrationsProps> = ({
  registrations,
  onAdd,
  onEdit,
}) => {
  const { requireAuth } = useAuth();
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationSort, setRegistrationSort] = useState<
    'name' | 'email' | 'id'
  >('name');

  const filteredRegistrations = [...registrations]
    .sort((a, b) => {
      if (registrationSort === 'id') return (a.id ?? 0) - (b.id ?? 0);
      if (registrationSort === 'email')
        return (a.student?.email ?? '').localeCompare(b.student?.email ?? '');
      return (a.student?.userName ?? '').localeCompare(b.student?.userName ?? '');
    })
    .filter((registration) => {
      const query = registrationQuery.trim().toLowerCase();
      if (!query) return true;
      const name = registration.student?.userName?.toLowerCase() ?? '';
      const email = registration.student?.email?.toLowerCase() ?? '';
      return (
        name.includes(query) ||
        email.includes(query) ||
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
            Students attending this module
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
          placeholder="Search by student name or email"
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
          <option value="name">Student name</option>
          <option value="email">Email</option>
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
                  {registration.student?.userName ?? 'Student'}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {registration.student?.email ?? 'Unknown email'}
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

export default ModuleRegistrations;

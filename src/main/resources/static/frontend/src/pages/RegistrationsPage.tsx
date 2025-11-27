import PageShell from "../components/PageShell";
import EntityCard from "../components/EntityCard";
import StateNotice from "../components/StateNotice";
import { useCollection } from "../hooks/useCollection";
import { Registration } from "../types";

function buildTitle(registration: Registration) {
  const studentName = [registration.student?.firstName, registration.student?.lastName]
    .filter(Boolean)
    .join(" ") || "Student";
  const moduleName = registration.module?.code || registration.module?.name || "Module";
  return `${studentName} • ${moduleName}`;
}

export default function RegistrationsPage() {
  const { data, loading, error, refresh } = useCollection<Registration>("/registrations");

  return (
    <PageShell
      title="Registrations"
      subtitle="Where students meet modules — view current enrolments in a calm, structured grid."
      actions={
        <button
          onClick={refresh}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-400/40 transition hover:-translate-y-0.5"
        >
          Refresh
        </button>
      }
    >
      {error && <StateNotice title="Could not load registrations" message={error} tone="error" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-card h-40 animate-pulse rounded-3xl bg-white/60"
            />
          ))}

        {!loading && data.length === 0 && (
          <StateNotice
            title="No registrations"
            message="As enrolments are added through the API, they will flow into this page."
          />
        )}

        {!loading &&
          data.map((registration) => (
            <EntityCard
              key={`${registration.id}-${registration.student?.userName}-${registration.module?.code}`}
              title={buildTitle(registration)}
              subtitle={registration.student?.email || registration.student?.userName || "Contact pending"}
              meta={registration.module?.code || registration.module?.name || "Module"}
              footer={`ID: ${registration.id ?? "pending"}`}
            >
              <p className="text-slate-500">{registration.module?.name || "Module details pending"}</p>
            </EntityCard>
          ))}
      </div>
    </PageShell>
  );
}

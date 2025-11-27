import PageShell from "../components/PageShell";
import EntityCard from "../components/EntityCard";
import StateNotice from "../components/StateNotice";
import { useCollection } from "../hooks/useCollection";
import { Module } from "../types";

export default function ModulesPage() {
  const { data, loading, error, refresh } = useCollection<Module>("/modules");

  return (
    <PageShell
      title="Modules"
      subtitle="Module codes, friendly names, and whether they’re mandatory — rendered with calm precision."
      actions={
        <button
          onClick={refresh}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-400/40 transition hover:-translate-y-0.5"
        >
          Refresh
        </button>
      }
    >
      {error && <StateNotice title="Could not load modules" message={error} tone="error" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-card h-40 animate-pulse rounded-3xl bg-white/60"
            />
          ))}

        {!loading && data.length === 0 && (
          <StateNotice title="No modules" message="Create modules through the API to see them in this gallery." />
        )}

        {!loading &&
          data.map((module) => (
            <EntityCard
              key={`${module.id}-${module.code}`}
              title={module.name || "Untitled module"}
              subtitle={module.code || "Code missing"}
              meta={module.mnc ? "Mandatory" : "Optional"}
            >
              <p className="text-slate-500">ID: {module.id ?? "pending"}</p>
            </EntityCard>
          ))}
      </div>
    </PageShell>
  );
}

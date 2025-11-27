import PageShell from "../components/PageShell";
import EntityCard from "../components/EntityCard";
import StateNotice from "../components/StateNotice";
import { useCollection } from "../hooks/useCollection";
import { Grade } from "../types";

function buildLabel(grade: Grade) {
  const studentName = [grade.student?.firstName, grade.student?.lastName].filter(Boolean).join(" ") || "Student";
  const moduleName = grade.module?.code || grade.module?.name || "Module";
  return `${studentName} · ${moduleName}`;
}

export default function GradesPage() {
  const { data, loading, error, refresh } = useCollection<Grade>("/grades");

  return (
    <PageShell
      title="Grades"
      subtitle="Scores paired with the students and modules they belong to, displayed with soft glassmorphism."
      actions={
        <button
          onClick={refresh}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-400/40 transition hover:-translate-y-0.5"
        >
          Refresh
        </button>
      }
    >
      {error && <StateNotice title="Could not load grades" message={error} tone="error" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-card h-40 animate-pulse rounded-3xl bg-white/60"
            />
          ))}

        {!loading && data.length === 0 && (
          <StateNotice title="No grades" message="Once grades are recorded, they will appear in this gallery." />
        )}

        {!loading &&
          data.map((grade) => (
            <EntityCard
              key={`${grade.id}-${grade.student?.userName}-${grade.module?.code}`}
              title={buildLabel(grade)}
              subtitle={grade.student?.email || grade.student?.userName || "Contact pending"}
              meta={grade.score !== undefined ? `${grade.score}%` : "Awaiting score"}
              footer={`ID: ${grade.id ?? "pending"}`}
            />
          ))}
      </div>
    </PageShell>
  );
}

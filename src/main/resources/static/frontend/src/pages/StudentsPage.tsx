import PageShell from "../components/PageShell";
import EntityCard from "../components/EntityCard";
import StateNotice from "../components/StateNotice";
import { useCollection } from "../hooks/useCollection";
import { Student } from "../types";

export default function StudentsPage() {
  const { data, loading, error, refresh } = useCollection<Student>("/students");

  return (
    <PageShell
      title="Students"
      subtitle="Elegant roster management with quick access to names, usernames, and contact details."
      actions={
        <button
          onClick={refresh}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-400/40 transition hover:-translate-y-0.5"
        >
          Refresh
        </button>
      }
    >
      {error && <StateNotice title="Could not load students" message={error} tone="error" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-card h-40 animate-pulse rounded-3xl bg-white/60"
            />
          ))}

        {!loading && data.length === 0 && (
          <StateNotice title="No students yet" message="Add new students through the API and they will appear here instantly." />
        )}

        {!loading &&
          data.map((student) => {
            const fullName = [student.firstName, student.lastName].filter(Boolean).join(" ") || "Unnamed";
            return (
              <EntityCard
                key={`${student.id}-${student.userName}-${fullName}`}
                title={fullName}
                subtitle={student.userName || "Username pending"}
                meta={student.email || "Email unavailable"}
              >
                <p className="text-slate-500">ID: {student.id ?? "pending"}</p>
              </EntityCard>
            );
          })}
      </div>
    </PageShell>
  );
}

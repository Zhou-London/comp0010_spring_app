interface StatPanelProps {
  label: string;
  value: string;
  hint?: string;
}

export default function StatPanel({ label, value, hint }: StatPanelProps) {
  return (
    <div className="glass-card rounded-3xl p-4 shadow-lg">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

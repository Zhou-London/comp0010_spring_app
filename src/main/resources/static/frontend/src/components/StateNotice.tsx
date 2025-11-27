interface StateNoticeProps {
  title: string;
  message: string;
  tone?: "info" | "error";
}

export default function StateNotice({ title, message, tone = "info" }: StateNoticeProps) {
  const color = tone === "error" ? "text-rose-600" : "text-slate-600";
  const border = tone === "error" ? "border-rose-100" : "border-slate-100";

  return (
    <div
      className={`glass-card rounded-2xl border ${border} px-4 py-3 text-sm shadow-inner shadow-white/50 ${color}`}
    >
      <p className="font-semibold">{title}</p>
      <p className="text-slate-500">{message}</p>
    </div>
  );
}

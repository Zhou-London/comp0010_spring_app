import { ReactNode } from "react";

interface EntityCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  footer?: ReactNode;
  children?: ReactNode;
}

export default function EntityCard({ title, subtitle, meta, footer, children }: EntityCardProps) {
  return (
    <div className="glass-card flex h-full flex-col rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </div>
        {meta && (
          <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white shadow-lg shadow-slate-400/30">
            {meta}
          </span>
        )}
      </div>
      {children && <div className="mt-4 space-y-2 text-sm text-slate-600">{children}</div>}
      {footer && <div className="mt-5 text-xs text-slate-500">{footer}</div>}
    </div>
  );
}

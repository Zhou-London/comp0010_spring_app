import React from "react";
import { Link as RouterLink } from "react-router-dom";

type TrailItem = {
  label: string;
  href?: string;
};

function PageHeader(props: {
  title: string;
  description?: string;
  trail?: TrailItem[];
  action?: React.ReactNode;
}) {
  const { title, description, trail, action } = props;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div className="space-y-2">
        {trail && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            {trail.map((item, idx) => (
              <React.Fragment key={item.label}>
                {item.href ? (
                  <RouterLink to={item.href} className="hover:text-amber-300 transition-colors">
                    {item.label}
                  </RouterLink>
                ) : (
                  <span className="text-amber-300">{item.label}</span>
                )}
                {idx < trail.length - 1 && <span className="text-slate-500">/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h1>
        {description && <p className="text-slate-300 max-w-3xl leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default PageHeader;

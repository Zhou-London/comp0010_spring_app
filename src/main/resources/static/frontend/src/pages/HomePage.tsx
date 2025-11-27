import { Link } from "react-router-dom";
import EntityCard from "../components/EntityCard";
import StatPanel from "../components/StatPanel";
import { useCollection } from "../hooks/useCollection";
import { Grade, Module, Registration, Student } from "../types";

const quickLinks = [
  { title: "Students", description: "Profiles and contact details", to: "/students" },
  { title: "Modules", description: "Codes, names, and mandatory status", to: "/modules" },
  { title: "Grades", description: "Scores across every module", to: "/grades" },
  { title: "Registrations", description: "Who is taking what and when", to: "/registrations" },
];

export default function HomePage() {
  const { data: students } = useCollection<Student>("/students");
  const { data: modules } = useCollection<Module>("/modules");
  const { data: grades } = useCollection<Grade>("/grades");
  const { data: registrations } = useCollection<Registration>("/registrations");

  return (
    <div className="space-y-12">
      <div className="glass-card relative overflow-hidden rounded-[32px] px-8 py-10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/90 to-white/70" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Academic overview</p>
            <h2 className="text-4xl font-semibold text-slate-900">
              Everything about students, modules, and performance—presented with clarity.
            </h2>
            <p className="max-w-2xl text-slate-600">
              The MI5 Academic Studio brings your core records into one elegant view. Browse cohorts, explore
              modules, and track grades with an experience inspired by Apple’s calm precision.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-medium">
              <Link
                to="/students"
                className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-lg shadow-slate-400/40 transition hover:-translate-y-0.5"
              >
                Start with Students
              </Link>
              <Link
                to="/modules"
                className="rounded-full bg-white/70 px-4 py-2 text-slate-900 shadow-inner shadow-white/70 transition hover:bg-white"
              >
                Explore Modules
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatPanel label="Students" value={`${students.length}`} hint="active profiles" />
            <StatPanel label="Modules" value={`${modules.length}`} hint="available classes" />
            <StatPanel label="Grades" value={`${grades.length}`} hint="scores captured" />
            <StatPanel label="Registrations" value={`${registrations.length}`} hint="student-module links" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
        <div className="grid gap-5 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="h-full">
              <EntityCard title={link.title} subtitle={link.description} meta="Open">
                <p className="text-slate-500">Dive into {link.title.toLowerCase()} with a polished, glassy layout.</p>
              </EntityCard>
            </Link>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fresh updates</p>
              <h3 className="text-xl font-semibold text-slate-900">What’s happening</h3>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">Live</span>
          </div>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <p>• Tailored Apple-inspired layout with softened glassmorphism.</p>
            <p>• Dedicated routes for students, modules, grades, and registrations.</p>
            <p>• Live data pulled directly from the Spring Boot API.</p>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-inner shadow-slate-500/30">
            Connected to the backend at <span className="font-semibold">0.0.0.0:2800</span> — ready for your data.
          </div>
        </div>
      </div>
    </div>
  );
}

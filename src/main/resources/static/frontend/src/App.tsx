import { Outlet } from "react-router-dom";
import Navigation from "./components/Navigation";

export default function App() {
  return (
    <div className="relative min-h-screen px-4 pb-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 -top-28 h-80 w-80 rounded-full bg-indigo-200 blur-[120px]" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-emerald-200 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-200 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <Navigation />
        <Outlet />
      </div>
    </div>
  );
}

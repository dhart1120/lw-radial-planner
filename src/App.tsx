import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { BlackMarketForecasterPage } from "./features/black-market-forcaster/BlackMarketForecasterPage";
import { RadialPlannerPage } from "./features/build-timer/RadialPlannerPage";
import { HomePage } from "./pages/HomePage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold transition-colors",
    isActive
      ? "bg-sky-600 text-white shadow-lg shadow-sky-900/40"
      : "bg-neutral-900/60 text-slate-200 hover:border-sky-500/70 hover:text-sky-100",
  ].join(" ");

function App() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-background text-foreground text-left">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-left">
        {!isHome && (
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-neutral-900/70 px-5 py-4 shadow-lg">
            <div className="space-y-1">
              <NavLink
                to="/"
                className="text-xs uppercase tracking-[0.35em] text-slate-400 hover:text-sky-200"
              >
                Last War Tools
              </NavLink>
            </div>
            <nav className="flex flex-wrap gap-2">
              <NavLink to="/radial-planner" className={navLinkClass}>
                Build Timer
              </NavLink>
              <NavLink to="/bm-forecaster" className={navLinkClass}>
                BM Forecaster
              </NavLink>
            </nav>
          </header>
        )}

        <main className="pb-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/radial-planner" element={<RadialPlannerPage />} />
            <Route path="/bm-forecaster" element={<BlackMarketForecasterPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;

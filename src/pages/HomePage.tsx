import { Link } from "react-router-dom";

type FeatureLink = {
  title: string;
  description: string;
  to: string;
  badge?: string;
};

const features: FeatureLink[] = [
  {
    title: "Build Timer",
    description: "Plan and schedule your build timers with dial, queues, and live clocks.",
    to: "/radial-planner",
    badge: "Live",
  },
  {
    title: "Black Market Forecaster",
    description: "Preview supply drops and deals. Stubbed for now while we wire in data.",
    to: "/bm-forecaster",
    badge: "New",
  },
];

export function HomePage() {
  return (
    <main className="space-y-10 text-left">
      <section className="space-y-3 rounded-2xl border border-slate-800 bg-neutral-900/70 px-6 py-8 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-4xl font-black leading-tight text-slate-100">
            Last War Tools
          </h1>
          <p className="text-lg text-slate-300">
            Pick a feature to open.
          </p>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {features.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-700 bg-neutral-900/70 p-6 text-slate-100 shadow-lg transition hover:-translate-y-1 hover:border-sky-500/80 hover:shadow-sky-900/40"
          >
            {feature.badge ? (
              <span className="inline-block w-fit rounded-full bg-sky-700/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-100">
                {feature.badge}
              </span>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <span className="text-xl font-semibold leading-tight group-hover:text-sky-200">
                {feature.title}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

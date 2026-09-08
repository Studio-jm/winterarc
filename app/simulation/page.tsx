import Link from "next/link";
import { Banners } from "@/components/Banners";
import { SimulationBadge } from "@/components/SimulationBadge";
import { SIMULATION_INTRO, buildSimulationWeek } from "@/lib/simulation/week";
import { parisDate } from "@/lib/time";

export const dynamic = "force-dynamic";

function fmtHours(n: number): string {
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

export default function SimulationPage() {
  const week = buildSimulationWeek(parisDate());
  return (
    <main className="page gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <SimulationBadge />
          <p className="label">Winter Arc</p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Aperçu simulation</h1>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{SIMULATION_INTRO}</p>
      </header>

      <ol className="flex flex-col gap-3">
        {week.days.map((day) => (
          <li key={day.localDate}>
            <article className="tile flex flex-col gap-3" data-source="simulation" data-date={day.localDate}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label">{day.localDate}</p>
                  <h2 className="mt-1 text-lg font-medium capitalize">{day.weekday}</h2>
                </div>
                <SimulationBadge />
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="label">Séance</dt>
                  <dd className="mt-1">
                    <span className="font-medium">{day.session.label}</span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">{day.session.caption}</span>
                  </dd>
                </div>
                <div>
                  <dt className="label">RPE</dt>
                  <dd className="mt-1 font-medium">{day.rpe}</dd>
                </div>
                <div>
                  <dt className="label">Sommeil</dt>
                  <dd className="mt-1 font-medium">{fmtHours(day.sleepHours)}</dd>
                </div>
                <div>
                  <dt className="label">Repas</dt>
                  <dd className="mt-1">
                    <span className="font-medium">
                      {day.meal.kcal} kcal · {day.meal.estimate}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {day.meal.text} · démo
                    </span>
                  </dd>
                </div>
              </dl>

              <Banners banners={day.banners} />
            </article>
          </li>
        ))}
      </ol>

      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Source isolée <code className="text-[var(--ice)]">simulation</code> — hors saisie et imports. Pas un plan
        d&apos;entraînement.
      </p>
      <Link href="/" className="text-sm text-[var(--muted)] underline underline-offset-4">
        Retour aujourd&apos;hui
      </Link>
    </main>
  );
}

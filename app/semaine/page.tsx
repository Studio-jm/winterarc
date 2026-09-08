import Link from "next/link";
import { CampusCoachPaste } from "@/components/CampusCoachPaste";
import { loadSemaine } from "@/lib/semaine/week";
import { formatParisLong, parisDate } from "@/lib/time";
import type { SemaineDay } from "@/lib/semaine/week";

export const dynamic = "force-dynamic";

function fmtHours(n: number | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

function fmtKm(m: number | null): string {
  if (m == null) return "—";
  return `${(m / 1000).toFixed(1)} km`;
}

export default async function SemainePage() {
  const today = parisDate();
  const week = await loadSemaine(today);
  return (
    <main className="page gap-6">
      <header>
        <p className="label">Winter Arc</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cette semaine</h1>
        <p className="mt-1 text-sm capitalize text-[var(--muted)]">
          {week.monday} → {week.sunday} · {formatParisLong()}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{week.intro}</p>
      </header>

      <ol className="flex flex-col gap-4">
        {week.days.map((day) => (
          <li key={day.localDate}>
            <DayCard day={day} />
          </li>
        ))}
      </ol>

      <Link href="/" className="text-sm text-[var(--muted)] underline underline-offset-4">
        Retour aujourd&apos;hui
      </Link>
    </main>
  );
}

function DayCard({ day }: { day: SemaineDay }) {
  const { prevu, fait, lever } = day;
  return (
    <article
      className="tile flex flex-col gap-4"
      data-date={day.localDate}
      data-today={day.isToday ? "true" : "false"}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="label">{day.localDate}</p>
          <h2 className="mt-1 text-lg font-medium capitalize">
            {day.weekday}
            {day.isToday ? (
              <span className="ml-2 text-xs font-normal uppercase tracking-[0.16em] text-[var(--ice)]">
                aujourd&apos;hui
              </span>
            ) : null}
          </h2>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <p className="label">Prévu</p>
        <CampusCoachPaste
          key={`${day.localDate}:${prevu.campusCoachText}`}
          localDate={day.localDate}
          initialText={prevu.campusCoachText}
        />
        <p className="text-sm text-[var(--muted)]">{prevu.optional.label}</p>
        <p className="text-sm text-[var(--muted)]">{prevu.nutrition.line}</p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="label">Fait</p>
        {fait.empty ? (
          <p className="text-sm text-[var(--muted)]">Rien de saisi.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="label">Séance</dt>
              <dd className="mt-1">
                {fait.sessions.length ? (
                  <ul className="flex flex-col gap-1">
                    {fait.sessions.map((s) => (
                      <li key={s.id}>
                        <span className="capitalize">{s.sport ?? s.source}</span>
                        <span className="block text-xs text-[var(--muted)]">
                          {fmtKm(s.distanceM)}
                          {s.durationS != null ? ` · ${Math.round(s.durationS / 60)} min` : ""}
                          {` · ${s.source}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="label">Forme / RPE</dt>
              <dd className="mt-1 font-medium">{fait.rpe == null ? "—" : fait.rpe}</dd>
            </div>
            <div>
              <dt className="label">Sommeil</dt>
              <dd className="mt-1 font-medium">
                {fmtHours(fait.sleepHours)}
                {fait.sleepSource ? (
                  <span className="ml-1 text-xs font-normal text-[var(--muted)]">
                    {fait.sleepSource}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="label">Douleur</dt>
              <dd className="mt-1 font-medium">
                {fait.pain == null ? "—" : fait.pain}
                {fait.painZone ? (
                  <span className="ml-1 text-xs font-normal text-[var(--muted)]">
                    {fait.painZone}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="label">Repas</dt>
              <dd className="mt-1">
                {fait.mealsCount ? (
                  <>
                    <span className="font-medium">
                      {fait.mealsKcal} kcal · high
                    </span>
                    <ul className="mt-1 text-xs text-[var(--muted)]">
                      {fait.meals.map((m) => (
                        <li key={m.id}>{m.text}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="label">Lever</p>
        {lever.visible ? (
          <div
            className={lever.facultatif.tone === "red" ? "banner-red" : "banner-calm"}
            data-lever={lever.facultatif.rules.join(",")}
            data-tone={lever.facultatif.tone ?? ""}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">
              {lever.facultatif.rules.join(" · ")}
            </p>
            <p className="mt-1 text-base font-medium">{lever.facultatif.label}</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">—</p>
        )}
      </section>
    </article>
  );
}

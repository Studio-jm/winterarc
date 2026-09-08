import Link from "next/link";
import { Banners } from "@/components/Banners";
import { loadToday } from "@/lib/store";
import { formatParisLong, parisDate } from "@/lib/time";

export const dynamic = "force-dynamic";

function fmtHours(n: number | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

export default async function HomePage() {
  const today = await loadToday(parisDate());
  return (
    <main className="page gap-6">
      <header>
        <p className="label">Winter Arc</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Aujourd&apos;hui</h1>
        <p className="mt-1 capitalize text-[var(--muted)]">{formatParisLong()}</p>
      </header>

      <Banners banners={today.evaluation.banners} />

      <section className="grid grid-cols-2 gap-3">
        <Tile label="Sommeil" value={fmtHours(today.sleepHours)} hint={today.sleepSource === "import" ? "import" : today.sleepSource === "saisie" ? "saisie" : "à saisir"} href="/saisie" />
        <Tile label="RPE" value={today.rpe == null ? "—" : String(today.rpe)} hint="1–10" href="/saisie" />
        <Tile
          label="Douleur"
          value={today.pain == null ? "—" : String(today.pain)}
          hint={today.painZone || "zone"}
          href="/saisie"
        />
        <Tile
          label="Repas"
          value={today.mealsCount ? `${today.mealsKcal} kcal` : "—"}
          hint={today.mealsCount ? `${today.mealsCount} · high` : "à saisir"}
          href="/repas"
        />
      </section>

      {today.activities.length ? (
        <section className="tile">
          <p className="label">Séances</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {today.activities.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="capitalize">
                  {a.sport ?? a.source}{" "}
                  <span className="text-[var(--muted)]">{a.source}</span>
                </span>
                <span className="text-[var(--muted)]">
                  {a.distance_m != null ? `${(a.distance_m / 1000).toFixed(1)} km` : "—"}
                  {a.duration_s != null ? ` · ${Math.round(a.duration_s / 60)} min` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        Règles {today.evaluation.rulesVersion} · déterministes · pas de LLM
      </p>
    </main>
  );
}

function Tile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <Link href={href} className="tile block">
      <p className="label">{label}</p>
      <p className="mt-3 text-2xl font-medium tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </Link>
  );
}

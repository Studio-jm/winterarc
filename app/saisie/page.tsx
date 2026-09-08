import { SaisieForm } from "@/components/SaisieForm";
import { importedSleepHours, loadSaisie } from "@/lib/store";
import { DEFAULT_SLEEP_HOURS, parisDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function SaisiePage() {
  const date = parisDate();
  const row = await loadSaisie(date);
  const imported = await importedSleepHours(date);
  const sleepPrefill = imported ?? row?.sleep_hours ?? DEFAULT_SLEEP_HOURS;
  return (
    <main className="page gap-6">
      <header>
        <p className="label">{date}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Saisie</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Une ligne par jour Europe/Paris. N&apos;écrase pas les imports.</p>
      </header>
      <SaisieForm
        localDate={date}
        sleepPrefill={sleepPrefill}
        initial={
          row
            ? {
                rpe: row.rpe,
                sleepHours: row.sleep_hours,
                pain: row.pain,
                painZone: row.pain_zone,
                gait: Boolean(row.gait),
                risingPain: Boolean(row.rising_pain),
                pain24h: Boolean(row.pain_24h),
                nightPain: Boolean(row.night_pain),
                swelling: Boolean(row.swelling),
                focalTibial: Boolean(row.focal_tibial),
                fever: Boolean(row.fever),
                chest: Boolean(row.chest),
                limp: Boolean(row.limp),
                coldCalves: Boolean(row.cold_calves),
                notes: row.notes,
              }
            : { sleepHours: sleepPrefill }
        }
      />
    </main>
  );
}

import { ImportPanel } from "@/components/ImportPanel";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <main className="page gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Import</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Apple Health XML, FIT, GPX. Pas de Strava, pas de HealthKit natif.
        </p>
      </header>
      <ImportPanel />
    </main>
  );
}

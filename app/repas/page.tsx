import { RepasForm } from "@/components/RepasForm";
import { getDb } from "@/lib/db";
import { parisDate } from "@/lib/time";
import type { RepasRow } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RepasPage() {
  const date = parisDate();
  const db = await getDb();
  const rows = await db.all<RepasRow>(`SELECT * FROM repas WHERE local_date = ? ORDER BY id DESC`, [date]);
  const total = rows.reduce((s, r) => s + r.kcal, 0);
  return (
    <main className="page gap-6">
      <header>
        <p className="label">{date}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Repas</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Texte libre. Heuristique high-end, jamais de LLM.
          {rows.length ? ` · ${total} kcal (high)` : ""}
        </p>
      </header>
      <RepasForm localDate={date} />
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id} className="tile flex items-baseline justify-between gap-3">
            <div>
              <p>{r.text}</p>
              {r.portion ? <p className="text-xs text-[var(--muted)]">{r.portion}</p> : null}
            </div>
            <p className="text-sm text-[var(--muted)]">
              {r.kcal} <span className="uppercase tracking-wider">{r.estimate}</span>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

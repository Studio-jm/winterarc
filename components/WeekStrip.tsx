"use client";

import { useState } from "react";
import { CampusCoachPaste } from "@/components/CampusCoachPaste";
import type { HomeWeekDay } from "@/lib/home/types";

function stripLabel(type: string): string {
  if (type === "Repos / force") return "Repos";
  if (type === "Tempo / fractionné") return "Tempo";
  if (type === "Sortie longue") return "Longue";
  return type;
}

export function WeekStrip({ days }: { days: HomeWeekDay[] }) {
  const today = days.find((d) => d.isToday)?.localDate ?? days[0]?.localDate;
  const [selected, setSelected] = useState(today);
  const day = days.find((d) => d.localDate === selected) ?? days[0];
  if (!day) return null;

  return (
    <section className="flex flex-col gap-3" data-week-strip="campus-coach">
      <p className="label">Semaine · jusqu&apos;à Lille</p>
      <ol className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const active = d.localDate === day.localDate;
          return (
            <li key={d.localDate}>
              <button
                type="button"
                onClick={() => setSelected(d.localDate)}
                data-date={d.localDate}
                data-today={d.isToday ? "true" : "false"}
                data-mirror={d.fromMirror ? "true" : "false"}
                className={`flex h-full w-full flex-col items-center gap-1 rounded-xl border px-0.5 py-2 text-center ${
                  active
                    ? "border-[var(--ice)] bg-[var(--card)]"
                    : "border-[var(--line)] bg-transparent text-[var(--muted)]"
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.12em]">{d.weekdayShort}</span>
                <span className="text-[11px] leading-tight text-[var(--fg)]">{stripLabel(d.session.type)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Miroir Campus Coach · affichage. Pas de progression auto.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-[var(--muted)]">Corriger (coller)</summary>
        <div className="mt-3">
          <CampusCoachPaste
            key={`${day.localDate}:${day.displayText}`}
            localDate={day.localDate}
            initialText={day.displayText}
            label={`Coller · ${day.weekday}`}
            compact
          />
        </div>
      </details>
    </section>
  );
}

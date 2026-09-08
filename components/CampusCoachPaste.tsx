"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  localDate: string;
  initialText: string;
  label?: string;
  compact?: boolean;
};

export function CampusCoachPaste({ localDate, initialText, label, compact }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError(null);
    setOk(false);
    const campusCoachText = String(formData.get("campusCoachText") ?? "");
    const res = await fetch("/api/plan", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ localDate, campusCoachText }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Échec");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className="label">{label ?? "Course du jour"}</span>
        <textarea
          name="campusCoachText"
          rows={compact ? 2 : 3}
          defaultValue={initialText}
          placeholder="Coller la séance Campus Coach. L'app ne l'écrit pas."
          className={`field resize-y text-sm leading-relaxed ${compact ? "min-h-[3.25rem]" : "min-h-[4.5rem]"}`}
        />
      </label>
      {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
      {ok ? <p className="text-xs text-[var(--muted)]">Enregistré tel quel.</p> : null}
      <button className="btn h-10 text-sm" disabled={busy} type="submit">
        {busy ? "…" : "Enregistrer le collage"}
      </button>
    </form>
  );
}

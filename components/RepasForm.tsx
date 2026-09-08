"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RepasForm({ localDate }: { localDate: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{ kcal: number; estimate: string } | null>(null);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/repas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        localDate,
        text: String(formData.get("text") || "").trim(),
        portion: String(formData.get("portion") || "").trim() || null,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Échec");
      return;
    }
    setLast({ kcal: json.repas.kcal, estimate: json.repas.estimate });
    (document.getElementById("repas-form") as HTMLFormElement | null)?.reset();
    router.refresh();
  }

  return (
    <form id="repas-form" action={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="label">Quoi</span>
        <input name="text" required placeholder="pâtes bolo, pizza…" className="field" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="label">Portion (optionnel)</span>
        <input name="portion" placeholder="petite, grande, double…" className="field" />
      </label>
      {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
      {last ? (
        <p className="text-sm text-[var(--muted)]">
          ~{last.kcal} kcal <span className="uppercase tracking-wider">({last.estimate})</span>
        </p>
      ) : null}
      <button className="btn" disabled={busy} type="submit">
        {busy ? "…" : "Ajouter"}
      </button>
    </form>
  );
}

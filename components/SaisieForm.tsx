"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DEFAULT_SLEEP_HOURS } from "@/lib/time";

const ZONES = ["", "tibia", "mollet", "genou", "cheville", "pied", "hanche", "dos", "autre"];

type Props = {
  localDate: string;
  sleepPrefill: number;
  initial?: Partial<{
    rpe: number;
    sleepHours: number;
    pain: number;
    painZone: string | null;
    gait: boolean;
    risingPain: boolean;
    pain24h: boolean;
    nightPain: boolean;
    swelling: boolean;
    focalTibial: boolean;
    fever: boolean;
    chest: boolean;
    limp: boolean;
    coldCalves: boolean;
    notes: string | null;
  }>;
};

export function SaisieForm({ localDate, sleepPrefill, initial }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const defaults = useMemo(
    () => ({
      rpe: initial?.rpe ?? 5,
      sleepHours: initial?.sleepHours ?? sleepPrefill ?? DEFAULT_SLEEP_HOURS,
      pain: initial?.pain ?? 0,
      painZone: initial?.painZone ?? "",
      gait: Boolean(initial?.gait),
      risingPain: Boolean(initial?.risingPain),
      pain24h: Boolean(initial?.pain24h),
      nightPain: Boolean(initial?.nightPain),
      swelling: Boolean(initial?.swelling),
      focalTibial: Boolean(initial?.focalTibial),
      fever: Boolean(initial?.fever),
      chest: Boolean(initial?.chest),
      limp: Boolean(initial?.limp),
      coldCalves: Boolean(initial?.coldCalves),
      notes: initial?.notes ?? "",
    }),
    [initial, sleepPrefill],
  );

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError(null);
    setOk(false);
    const payload = {
      localDate,
      rpe: Number(formData.get("rpe")),
      sleepHours: Number(formData.get("sleepHours")),
      pain: Number(formData.get("pain")),
      painZone: String(formData.get("painZone") || "") || null,
      gait: formData.get("gait") === "on",
      risingPain: formData.get("risingPain") === "on",
      pain24h: formData.get("pain24h") === "on",
      nightPain: formData.get("nightPain") === "on",
      swelling: formData.get("swelling") === "on",
      focalTibial: formData.get("focalTibial") === "on",
      fever: formData.get("fever") === "on",
      chest: formData.get("chest") === "on",
      limp: formData.get("limp") === "on",
      coldCalves: formData.get("coldCalves") === "on",
      notes: String(formData.get("notes") || "") || null,
    };
    const res = await fetch("/api/saisie", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Échec");
      return;
    }
    setOk(true);
    router.push("/");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="label">RPE (1–10)</span>
        <input name="rpe" type="range" min={1} max={10} defaultValue={defaults.rpe} />
        <span className="text-sm text-[var(--muted)]">Effort perçu de la journée</span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="label">Sommeil (h)</span>
        <input
          name="sleepHours"
          type="number"
          step="0.1"
          min={0}
          max={24}
          defaultValue={defaults.sleepHours}
          className="field"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="label">Douleur (0–10)</span>
        <input name="pain" type="range" min={0} max={10} defaultValue={defaults.pain} />
      </label>
      <label className="flex flex-col gap-2">
        <span className="label">Zone</span>
        <select name="painZone" defaultValue={defaults.painZone} className="field">
          {ZONES.map((z) => (
            <option key={z || "none"} value={z}>
              {z || "aucune"}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="label mb-2 w-full">Signaux</legend>
        <Chip name="gait" label="Démarche" defaultChecked={defaults.gait} />
        <Chip name="limp" label="Boiterie" defaultChecked={defaults.limp} />
        <Chip name="risingPain" label="Douleur au lever" defaultChecked={defaults.risingPain} />
        <Chip name="pain24h" label="Douleur 24 h" defaultChecked={defaults.pain24h} />
        <Chip name="nightPain" label="Douleur de nuit" defaultChecked={defaults.nightPain} />
        <Chip name="swelling" label="Gonflement" defaultChecked={defaults.swelling} />
        <Chip name="focalTibial" label="Tibial focal" defaultChecked={defaults.focalTibial} />
        <Chip name="coldCalves" label="Mollets froids" defaultChecked={defaults.coldCalves} />
        <Chip name="fever" label="Fièvre" defaultChecked={defaults.fever} />
        <Chip name="chest" label="Poitrine" defaultChecked={defaults.chest} />
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="label">Note</span>
        <textarea name="notes" rows={2} defaultValue={defaults.notes ?? ""} className="field" />
      </label>
      {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
      {ok ? <p className="text-sm text-[var(--muted)]">Enregistré.</p> : null}
      <button className="btn" disabled={busy} type="submit">
        {busy ? "…" : "Enregistrer"}
      </button>
    </form>
  );
}

function Chip({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="chip">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-[var(--ice)]" />
      {label}
    </label>
  );
}

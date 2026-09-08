"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Kind = "health" | "fit" | "gpx" | "example";

export function ImportPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(kind: Kind, file?: File | null) {
    setBusy(kind);
    setError(null);
    setMessage(null);
    try {
      let res: Response;
      if (kind === "example") {
        res = await fetch("/api/import/example", { method: "POST" });
      } else {
        if (!file) throw new Error("Choisis un fichier");
        if (file.size > 32 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 32 Mo)");
        const body = new FormData();
        body.set("file", file);
        res = await fetch(`/api/import/${kind}`, { method: "POST", body });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Échec import");
      if (kind === "health" || kind === "example") {
        setMessage(
          `Workouts +${json.workouts.inserted} (ignorés ${json.workouts.skipped}) · sommeil +${json.sleeps.inserted} (ignorés ${json.sleeps.skipped})`,
        );
      } else {
        setMessage(`Séance ${json.source} enregistrée (${json.inserted ? "nouvelle" : "déjà connue"}).`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button className="btn" type="button" disabled={Boolean(busy)} onClick={() => send("example")}>
        {busy === "example" ? "…" : "Importer l'exemple"}
      </button>
      <FileRow
        label="Apple Health (export.xml)"
        accept=".xml,text/xml,application/xml"
        busy={busy === "health"}
        onFile={(f) => send("health", f)}
      />
      <FileRow
        label="FIT Garmin"
        accept=".fit,application/octet-stream"
        busy={busy === "fit"}
        onFile={(f) => send("fit", f)}
      />
      <FileRow
        label="GPX"
        accept=".gpx,application/gpx+xml,text/xml"
        busy={busy === "gpx"}
        onFile={(f) => send("gpx", f)}
      />
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Plafond 32 Mo. Parsing SAX (XML/GPX) et FIT SDK. Les imports ne sont jamais écrasés (clé unique source +
        import_key). La saisie manuelle est une table à part.
      </p>
    </div>
  );
}

function FileRow({
  label,
  accept,
  busy,
  onFile,
}: {
  label: string;
  accept: string;
  busy: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{label}</span>
      <input
        type="file"
        accept={accept}
        disabled={busy}
        className="field file:mr-3 file:border-0 file:bg-transparent file:text-sm file:text-[var(--ice)]"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

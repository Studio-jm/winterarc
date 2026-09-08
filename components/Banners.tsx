import type { Banner } from "@/lib/rules";

const TONE: Record<string, string> = {
  red: "banner-red",
  calm: "banner-calm",
  note: "banner-note",
  info: "banner-info",
  stop: "banner-stop",
  review: "banner-review",
};

export function Banners({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {banners.map((b) => (
        <section key={b.ruleId} className={TONE[b.tone] ?? "banner-note"} data-rule={b.ruleId} data-tone={b.tone}>
          <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">{b.ruleId}</p>
          <h2 className="mt-1 text-base font-medium">{b.title}</h2>
          <p className="mt-1 text-sm leading-relaxed opacity-90">{b.body}</p>
        </section>
      ))}
    </div>
  );
}

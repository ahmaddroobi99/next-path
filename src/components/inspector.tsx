import { CHIP_MAP, CPU_UNITS } from "@/lib/sim/chips";
import { currentStep, useSim } from "@/lib/sim/store";
import { Badge } from "@/components/ui/badge";

export function Inspector() {
  const selected = useSim((s) => s.selected);
  const hex = useSim((s) => s.hex);
  const packets = useSim((s) => s.packets);
  const step = useSim((s) => currentStep(s));
  const chip = selected ? CHIP_MAP[selected] : null;
  const units = step?.units ?? [];

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">Now on the bus</p>
        <h2 className="mt-2 text-lg font-medium tracking-tight text-fg">{step?.title ?? "Idle"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{step?.body ?? "Choose a journey and press Run. Click any chip on the board for its dossier."}</p>
        {step && (
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">Format</dt>
              <dd className="mt-1 text-fg">{step.format}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">Size</dt>
              <dd className="mt-1 font-mono text-xs text-fg">{step.size}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">1991 → now</dt>
              <dd className="mt-1 text-muted">{step.modern}</dd>
            </div>
          </dl>
        )}
        {units.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {CPU_UNITS.map((u) => (
              <Badge key={u.id} tone={units.includes(u.id) ? "copper" : "mute"}>
                {u.name}
              </Badge>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">Data inspector</p>
        <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-phosphor">{hex}</pre>
        <p className="mt-2 text-xs text-subtle">Sample around the midpoint of the live raster, 24 bytes.</p>
      </section>

      {chip && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">{chip.maker}</p>
              <h3 className="mt-1 text-base font-medium text-fg">{chip.name}</h3>
              <p className="mt-0.5 font-mono text-xs text-copper">{chip.part}</p>
            </div>
            {chip.clock && <Badge tone="copper">{chip.clock}</Badge>}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{chip.detail}</p>
          <p className="mt-3 text-sm text-fg">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">Today </span>
            {chip.modern}
          </p>
        </section>
      )}

      {packets.length > 0 && (
        <section className="min-h-0 rounded-lg border border-border bg-surface p-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">Packet log</p>
          <div className="mt-3 max-h-56 overflow-auto">
            <table className="w-full text-left font-mono text-[0.7rem]">
              <thead className="text-subtle">
                <tr>
                  <th className="py-1 font-medium">#</th>
                  <th className="py-1 font-medium">seq</th>
                  <th className="py-1 font-medium">wire</th>
                  <th className="py-1 font-medium">flags</th>
                  <th className="py-1 font-medium">state</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((p) => (
                  <tr key={p.id} className="border-t border-border text-fg">
                    <td className="py-1 tabular">{p.id}</td>
                    <td className="py-1 tabular">{p.seq}</td>
                    <td className="py-1 tabular">{p.wire} B</td>
                    <td className="py-1">{p.flags}</td>
                    <td className="py-1 text-copper">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {packets[0] && (
            <pre className="mt-3 overflow-x-auto text-[0.65rem] leading-relaxed text-phosphor">
              {packets.find((p) => p.status === "on-wire" || p.status === "acked" || p.status === "delivered")?.hex ??
                packets[0].hex}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}

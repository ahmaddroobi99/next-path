import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CHIP_MAP } from "@/lib/sim/hardware";
import { useLab } from "@/store/lab";

export function ChipSheet() {
  const id = useLab((s) => s.selectedChip);
  const setChip = useLab((s) => s.setChip);
  const chip = id ? CHIP_MAP[id] : null;

  return (
    <Sheet open={!!chip} onOpenChange={(o) => !o && setChip(null)}>
      <SheetContent title={chip ? `${chip.name}` : "Chip"}>
        {chip && (
          <div className="space-y-5">
            <p className="font-mono text-xs tracking-wide text-muted">{chip.part}</p>
            <p className="text-sm leading-relaxed text-fg">{chip.blurb}</p>
            <dl className="grid grid-cols-2 gap-3">
              {chip.specs.map((s) => (
                <div key={s.label} className="rounded-md bg-elevated px-3 py-2">
                  <dt className="font-mono text-[10px] tracking-wider text-muted uppercase">{s.label}</dt>
                  <dd className="mt-0.5 text-sm">{s.value}</dd>
                </div>
              ))}
            </dl>
            {chip.internals && (
              <div>
                <p className="mb-2 font-mono text-[10px] tracking-wider text-muted uppercase">On die</p>
                <ul className="space-y-2">
                  {chip.internals.map((s) => (
                    <li key={s.label} className="flex justify-between gap-4 text-sm">
                      <span className="text-muted">{s.label}</span>
                      <span className="text-right">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

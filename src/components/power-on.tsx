import { Button } from "@/components/ui/button";
import { useSim } from "@/lib/sim/store";

export function PowerOn() {
  const powerOn = useSim((s) => s.powerOn);

  return (
    <main className="relative flex min-h-dvh flex-col justify-end bg-bg px-6 py-10 sm:justify-center sm:px-12">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden>
        <div className="absolute left-1/2 top-[18%] size-48 -translate-x-1/2 rotate-12 border border-fg sm:size-72" />
      </div>
      <div className="relative mx-auto w-full max-w-xl">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-copper">
          NeXTcube · Rev 2.4 · 1991
        </p>
        <h1 className="mt-5 text-4xl font-medium tracking-tight text-fg sm:text-6xl">
          NeXT Path
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
          Trace a photon from the camera to the MegaPixel phosphor. Then steal the screen
          and walk every packet across the 82586 onto 10BASE-T.
        </p>
        <p className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-subtle">
          MC68040 25 MHz · DSP56001 · 1120×832 · 10 Mb/s
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" onClick={powerOn}>
            Power on
          </Button>
        </div>
      </div>
    </main>
  );
}

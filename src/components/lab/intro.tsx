import { Button } from "@/components/ui/button";
import { useLab } from "@/store/lab";

export function Intro() {
  const dismiss = useLab((s) => s.dismissIntro);
  const capture = useLab((s) => s.capture);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg px-6">
      <div className="flex w-full max-w-3xl flex-col items-center gap-10 md:flex-row md:items-end md:gap-16">
        <div className="relative size-40 shrink-0 [perspective:800px]">
          <div className="nx-cube relative">
            <div className="nx-cube-face" style={{ transform: "translateZ(80px)" }}>
              <span className="size-6 rotate-45 bg-accent" />
            </div>
            <div className="nx-cube-face" style={{ transform: "rotateY(90deg) translateZ(80px)" }} />
            <div className="nx-cube-face" style={{ transform: "rotateY(-90deg) translateZ(80px)" }} />
            <div className="nx-cube-face" style={{ transform: "rotateY(180deg) translateZ(80px)" }} />
            <div className="nx-cube-face" style={{ transform: "rotateX(90deg) translateZ(80px)" }} />
            <div className="nx-cube-face" style={{ transform: "rotateX(-90deg) translateZ(80px)" }} />
          </div>
        </div>
        <div className="max-w-md space-y-4 text-center md:text-left">
          <p className="font-mono text-[11px] tracking-[0.28em] text-muted uppercase">1990 · 25 MHz · 10 Mbps</p>
          <h1 className="font-sans text-4xl font-medium tracking-tight text-fg sm:text-5xl">Cube Trace</h1>
          <p className="text-sm leading-relaxed text-muted">
            Follow a pixel through a NeXTcube. Camera into the 56001, across NeXTbus, through the 68040, onto
            the MegaPixel display — then out the LANCE as Ethernet frames.
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <Button
              className="min-h-11"
              onClick={() => {
                dismiss();
                void capture();
              }}
            >
              Enter the lab
            </Button>
            <Button variant="ghost" className="min-h-11" onClick={dismiss}>
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

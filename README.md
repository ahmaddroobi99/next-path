# NeXT Path

Interactive motherboard lab for the NeXTcube (Rev 2.4, 1991). Trace a frame from a camera ADC to the MegaPixel phosphor, then steal the screen and walk every Ethernet packet across the Intel 82586 onto 10BASE-T.

## What it models

- **MC68040 @ 25 MHz** — integer unit, on-chip FPU, PMMU, 4 KB I-cache, 4 KB D-cache
- **DSP56001 + MCM56824** — 24-bit DSP and 8K×24 SRAM (not the CPU)
- **ICP DMA + NeXTbus** — 32-bit multiplexed, 25 MHz, 100 MB/s burst
- **MegaPixel Display** — 1120×832, 2 bits/pixel, 68 Hz
- **Intel 82586** — 10BASE-T and 10BASE2, OUI `08:00:07`

Pixel path: photons → ADC → DSP → ICP DMA → RAM → 68040 2-bit quantiser → framebuffer → CRT.

Share path: framebuffer capture → XOR/RLE → TCP/IP → 82586 → PHY → wire (bandwidth / latency / loss) → remote ACK → peer CRT.

## Run

```bash
npm install
npm run dev
```

## Hardware note

The stock Cube had no webcam. Live colour video historically lived on the NeXTdimension (i860) board. This lab hangs a pedagogical 8-bit grayscale ADC off the DSP port so the rest of the journey is real silicon on the main board.

# Cube Trace

Interactive NeXTcube lab. Follow a single pixel from the camera through the 56001 DSP, across NeXTbus, into the 68040, onto the MegaPixel display — then out the LANCE as 10 Mbps Ethernet frames.

1990 · 25 MHz · 10 Mbps.

## What you can do

- **Enter the lab** and capture a still from the camera (NeXT bust, facade, office, or a live webcam).
- Watch the pixel path light up on the motherboard schematic.
- Step the pipeline, inspect chips (68040, 56001, LANCE, framebuffer), and read cycle / packet metrics.
- Share a frame over simulated Ethernet and see it land on the remote MegaPixel.

Keyboard: `Space` play/pause · `Enter` capture · `S` share · `R` reset · `.` step.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL. Production build: `npm run build`.

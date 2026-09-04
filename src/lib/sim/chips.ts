export type ChipId =
  | "camera"
  | "adc"
  | "dsp"
  | "dspRam"
  | "icp"
  | "bus"
  | "ram"
  | "cpu"
  | "memctl"
  | "ioasic"
  | "scsi"
  | "nic"
  | "phy"
  | "framebuffer"
  | "displayPort"
  | "monitor"
  | "rj45"
  | "bnc"
  | "nextbus"
  | "fpga"
  | "vlsi"
  | "remote";

export type CpuUnit = "iu" | "fpu" | "mmu" | "icache" | "dcache";

export interface Chip {
  id: ChipId;
  name: string;
  part: string;
  maker: string;
  clock?: string;
  role: string;
  blurb: string;
  detail: string;
  modern: string;
  box: { x: number; y: number; w: number; h: number };
  virtual?: boolean;
  pin?: "in" | "out";
}

/** Hotspots are percentages of the Wikimedia Rev 2.4 photograph. */
export const CHIPS: Chip[] = [
  {
    id: "ram",
    name: "Main memory",
    part: "16 × 30-pin SIMM",
    maker: "System RAM",
    clock: "25 MHz bus",
    role: "Working store for frames, stacks, and TCP buffers",
    blurb: "Eight to sixty-four megabytes in four banks. Every pixel that will ever be filtered, compressed, or packetised parks here first.",
    detail:
      "The Cube exposes sixteen 30-pin SIMM slots, organised as four independent banks. Typical kits were 8 MB; the ceiling is 64 MB. Burst fills from the Integrated Channel Processor land here as 32-bit words on the 25 MHz NeXTbus. There is no on-board L2 — the 68040's 8 KB of split cache is the only SRAM in the CPU's shadow, so frame-sized working sets thrash unless the DMA engine keeps the bus busy without interrupting the integer unit.",
    modern:
      "Today this is dual-channel DDR with tens of megabytes of L3. The idea is unchanged: a coherent place the GPU, NIC, and CPU can all DMA into.",
    box: { x: 7.5, y: 5.5, w: 36, h: 22 },
  },
  {
    id: "dspRam",
    name: "DSP static RAM",
    part: "MCM56824AFN35",
    maker: "Motorola",
    clock: "25 MHz",
    role: "24 KB (8K × 24) staging RAM for the 56001",
    blurb: "Not the CPU. This SRAM is the DSP's private notebook — 24-bit words, no contention with the 68040 until the ICP copies them out.",
    detail:
      "MCM56824 is an 8K × 24-bit high-speed static RAM sitting beside the DSP56001. The 56001's native word is 24 bits; this chip stores filter state, a ring of PCM samples, and — in this lab — a packed 8-bit grayscale tile before DMA. The Cube could expand DSP RAM to 96 KB. Confusing this part with the 68040 is a common misread of the silkscreen: the CPU is the PGA with the grid heatsink on the lower edge.",
    modern: "The SRAM sitting on a modern DSP/NPU die, or the tightly-coupled memory of a Cortex-M or Hexagon block.",
    box: { x: 54.2, y: 15.2, w: 7.6, h: 5.6 },
  },
  {
    id: "dsp",
    name: "Digital signal processor",
    part: "DSP56001B20",
    maker: "Motorola",
    clock: "25 MHz",
    role: "Real-time audio — and in this lab, the first stop for a video ADC",
    blurb: "A 24-bit DSP clocked at the same 25 MHz as the CPU. Stock firmware used it for 44.1 kHz stereo. Its port can ingest any sampled stream.",
    detail:
      "The DSP56001 has three 16-bit memory spaces (P, X, Y), hardware multiply-accumulate, and a host interface the 68040 talks to. NeXT shipped it for music and speech; the MegaPixel itself is not driven by the DSP. Live colour video historically needed the NeXTdimension (Intel i860 plus a video decoder). This simulation hangs a pedagogical 8-bit grayscale ADC off the DSP port — the architecture NeXT documented for 'digital signals' — so you can watch a frame cross the same host-port, SRAM, and DMA path audio already used.",
    modern:
      "A media block: Apple's Neural Engine / media engine, Qualcomm Hexagon, or the DSP inside a USB webcam that sends UVC packets.",
    box: { x: 48.6, y: 30.2, w: 13.2, h: 13 },
  },
  {
    id: "icp",
    name: "Integrated Channel Processor",
    part: "MB810331 (left PGA)",
    maker: "Fujitsu / NeXT",
    clock: "25 MHz",
    role: "12-channel DMA engine — the board's traffic cop",
    blurb: "Moves bytes so the 68040 does not have to. SCSI, Ethernet, sound, and display all ride ICP descriptors.",
    detail:
      "The two large gold-lidded Fujitsu PGAs are custom NeXT gate arrays. The left device is modelled here as the Integrated Channel Processor: a dozen DMA channels with linked-list descriptors in main memory. When the DSP has a full buffer, the ICP is programmed with a source (DSP host port / SRAM), a destination (a physical page the MMU has mapped), a length, and a completion interrupt. Burst writes on NeXTbus hit 100 MB/s on paper; real video tiles are a few hundred kilobytes and take a handful of microseconds of bus time.",
    modern:
      "IOMMU + DMA engines inside the chipset / SoC. Apple's DMA coprocessors, Intel IOAT, or the display controller's own scanout DMA.",
    box: { x: 28.4, y: 41.5, w: 16.2, h: 16.5 },
  },
  {
    id: "memctl",
    name: "Memory controller",
    part: "MB810331 (right PGA)",
    maker: "Fujitsu / NeXT",
    clock: "25 MHz",
    role: "SIMM timing, refresh, and NeXTbus slave for RAM",
    blurb: "Translates bus cycles into RAS/CAS for the sixteen SIMM slots and owns refresh so DRAM does not decay mid-frame.",
    detail:
      "The matching gold PGA on the right is modelled as the memory timing controller. It is the slave that answers NeXTbus cycles in the DRAM window, generates nibble-mode/burst RAS-CAS sequences, and refreshes all four banks. Framebuffer memory on the Cube is a separate array (the DIP DRAM along the lower edge) with its own slot in the address map, which is why a display write does not always contend with a CPU cache fill.",
    modern: "The memory controller on the CPU die, talking DDR5 with on-die ECC and bank-group scheduling.",
    box: { x: 48.2, y: 41.5, w: 16.4, h: 16.5 },
  },
  {
    id: "ioasic",
    name: "I/O controller",
    part: "SC139F601TC001",
    maker: "NeXT custom",
    role: "Glue: timers, interrupts, brightness, DSP host, SCC",
    blurb: "The quiet ASIC that actually wires the 68040 to everything that is not RAM or a DMA channel.",
    detail:
      "Decoded from the silkscreen as a NeXT custom I/O gate array. It fans out interrupt lines, maps the Zilog SCC (keyboard, mouse, serial), the DSP host port, front-panel brightness, and various timers into the 68040's address space. When a camera ADC flags 'buffer ready', this chip is what asserts the IRQ the kernel's DSP driver waits on.",
    modern: "PCH / southbridge / Apple's always-on co-processor that owns GPIO, UART, and SPI.",
    box: { x: 13.6, y: 47.8, w: 13.4, h: 13.2 },
  },
  {
    id: "cpu",
    name: "Central processor",
    part: "MC68040 @ 25 MHz",
    maker: "Motorola",
    clock: "25 MHz",
    role: "Integer unit, on-chip FPU, PMMU, 4 KB I-cache, 4 KB D-cache",
    blurb: "1.2 million transistors. The heatsinked PGA on the lower edge is the 68040 — not the SRAM next to the DSP.",
    detail:
      "The 68040 folds in what used to be three chips on the original NeXT Computer (68030 + 68882 FPU + 68851 PMMU). Caches are split 4 KB instruction / 4 KB data, write-back, with burst fill. A 2-bit quantiser and a 3×3 convolution both fit in the I-cache; a full JPEG encoder would not, which is why this lab uses delta + RLE instead of a modern codec. Clock is 25 MHz on this Rev 2.4 board (Turbo cubes ran 33 MHz). Peak integer throughput is roughly 20 MIPS — enough to walk a 1120×832 gray frame in a few tens of milliseconds.",
    modern:
      "An efficiency core. A single E-core of an Apple M-series or a low-power x86 core is tens of times faster, but the units — IU, FPU, MMU, split cache — are the same diagram.",
    box: { x: 28.6, y: 65.5, w: 16.4, h: 16.8 },
  },
  {
    id: "framebuffer",
    name: "MegaPixel framebuffer",
    part: "256 KB display DRAM",
    maker: "On-board VRAM array",
    role: "1120×832 at 2 bits/pixel, scanned 68 times a second",
    blurb: "The entire visible universe of a Cube is 232,960 bytes. Four gray levels, no colour, no GPU.",
    detail:
      "1120 × 832 × 2 bits = 232,960 bytes, rounded up into 256 KB of dedicated DRAM (the DIP array along the lower spine). There is no hardware cursor plane of note and no 2D blitter — Window Server (Display PostScript) composites in main RAM and the window server / driver writes the 2-bit result here. Scanout is independent of the CPU: a CRT controller walks this memory at 68 Hz and serialises pixels to the MegaPixel analog path. That independence is why desktop sharing must *read* this buffer rather than hooking the GPU, the way DXGI Desktop Duplication does on Windows today.",
    modern:
      "The GPU framebuffer in GDDR, scanned out over DisplayPort/HDMI. Sharing apps read it via Desktop Duplication, ScreenCaptureKit, or getDisplayMedia.",
    box: { x: 47.8, y: 64.2, w: 16.6, h: 18 },
  },
  {
    id: "vlsi",
    name: "Display / system VLSI",
    part: "VLSI Technology ASIC",
    maker: "VLSI Technology",
    role: "Video timing and 2-bit pixel path toward the CRT connector",
    blurb: "Turns framebuffer words into a 68 Hz analog waveform the MegaPixel monitor can hang on a phosphor.",
    detail:
      "The purple VLSI package on the lower left is modelled as the display companion: pixel clock, H/V sync for 1120×832 @ 68 Hz, and the 2-bit DAC that drives the analog display cable. Brightness is a separate analog control. Because there are only four voltage levels, a photograph must be dithered or posterised before it looks intentional on this screen.",
    modern: "An SoC display engine (Apple DCP, Intel display block) plus a DisplayPort PHY.",
    box: { x: 12.4, y: 70.5, w: 13.6, h: 13.5 },
  },
  {
    id: "scsi",
    name: "SCSI controller",
    part: "NCR 53C90A",
    maker: "NCR",
    clock: "SCSI-1",
    role: "8-bit SCSI host adapter for disk, optical, scanner, tape",
    blurb: "Not on the camera path. Included because every Cube disk read that is not RAM rides this chip.",
    detail:
      "NCR's 53C90A is a first-generation SCSI controller. The Cube boots from SCSI, talks to the magneto-optical drive on earlier machines, and can ingest a still from a SCSI scanner. A real 1991 'camera' workflow was often: snap on a SCSI device, DMA into RAM via this chip, *then* the pixel path below. This lab uses the DSP port instead so the signal-processing story stays on one board.",
    modern: "NVMe controller / AHCI. USB UVC is how cameras arrive now; SCSI's descendant is SAS in servers.",
    box: { x: 65.8, y: 22.6, w: 11.5, h: 9.2 },
  },
  {
    id: "nic",
    name: "Ethernet coprocessor",
    part: "Intel 82586",
    maker: "Intel",
    clock: "10 Mb/s",
    role: "LAN coprocessor: descriptors, CSMA/CD, CRC",
    blurb: "Builds Ethernet frames from a linked list the 68040 leaves in RAM. The CPU never bit-bangs the wire.",
    detail:
      "The 82586 is a bus-mastering LAN coprocessor. The kernel allocates a System Control Block plus command and receive descriptor rings in main memory. To send a screen-share packet the 68040 writes an Ethernet header (destination MAC, source — NeXT's OUI is 08:00:07 — type 0x0800), an IPv4+TCP header, and a payload; it then hands a command block to the 82586, which DMAs the frame, appends the 32-bit FCS, and runs CSMA/CD. Receive is symmetric: good frames land in RAM, a CRC error is dropped, and an IRQ wakes the stack. There is no TCP offload, no checksum offload, no TSO — every ACK is software.",
    modern:
      "A 2.5/10/40 GbE controller with TSO, checksum offload, RSS, and often a built-in RDMA engine. The descriptor-ring idea is identical.",
    box: { x: 66.5, y: 33.5, w: 12.2, h: 12 },
  },
  {
    id: "phy",
    name: "Ethernet transceiver",
    part: "10BASE-T / 10BASE2 PHY",
    maker: "Analog front-end",
    role: "Manchester encode, link pulses, BNC vs RJ-45 select",
    blurb: "Where bits become volts. Two media: twisted pair and thin coaxial.",
    detail:
      "The Cube ships both 10BASE-T (RJ-45, transformer-coupled) and 10BASE2 (BNC, 50 Ω thinnet). The transceiver Manchester-encodes the 10 Mb/s bitstream, handles collision detection for CSMA/CD, and — on BNC — expects a T-connector and terminator. A modern switch that will not link at 10 Mb/s half-duplex is why surviving Cubes often talk through a vintage hub.",
    modern: "The SFP+/BASE-T PHY next to the magnetics, plus autoneg and Energy-Efficient Ethernet.",
    box: { x: 80.8, y: 18.5, w: 8.4, h: 14 },
  },
  {
    id: "rj45",
    name: "10BASE-T jack",
    part: "RJ-45",
    maker: "I/O bracket",
    role: "Twisted-pair Ethernet",
    blurb: "The cube's window onto a 10 Mb/s LAN.",
    detail:
      "Pinout is standard 10BASE-T on the right-hand metal bracket. Link LEDs of the era were modest; in this lab the jack glows when frames are on the wire.",
    modern: "The 8P8C jack on a laptop dongle, or a USB-C dock's Ethernet port.",
    box: { x: 90.2, y: 10.5, w: 8.4, h: 16 },
  },
  {
    id: "displayPort",
    name: "MegaPixel connector",
    part: "Display video cable",
    maker: "NeXT",
    role: "Analog 2-bit gray + sync to the 17\" MegaPixel CRT",
    blurb: "Not VGA. A NeXT-specific cable carries the 1120×832 raster.",
    detail:
      "The MegaPixel Display is a 17-inch grayscale CRT at 1120×832, 68 Hz. The connector on the I/O bracket carries analog video derived from the 2-bit DAC, plus sync. Resolution was chosen so a US-letter page fits 1:1 with room for menus — Display PostScript's party trick.",
    modern: "DisplayPort / HDMI / USB-C Alt Mode. The idea: a serialised raster leaving the machine.",
    box: { x: 90.2, y: 28.5, w: 8.4, h: 18 },
  },
  {
    id: "bnc",
    name: "10BASE2 BNC",
    part: "BNC jack",
    maker: "I/O bracket",
    role: "Thinnet coaxial Ethernet",
    blurb: "The other way out. 50 ohm, T-connector, terminator — or silence.",
    detail:
      "10BASE2 shares the same MAC (the 82586) and is selected in hardware/firmware. Maximum segment 185 m, vampire-tap era topology. Screen sharing over thinnet is electrically identical to 10BASE-T after the PHY: same frames, same CSMA/CD, more opportunities to forget the terminator.",
    modern: "Gone. The closest ritual is plugging in SFP modules and arguing about FEC.",
    box: { x: 90.4, y: 58, w: 8.2, h: 10 },
  },
  {
    id: "nextbus",
    name: "NeXTbus slot",
    part: "Euro-DIN 96-pin",
    maker: "NeXT",
    clock: "25 MHz",
    role: "32-bit multiplexed expansion, 100 MB/s burst",
    blurb: "Four slots, one eaten by the motherboard. This is where a NeXTdimension video board would live.",
    detail:
      "NeXTbus is a 25 MHz, 32-bit multiplexed address/data bus on a 96-pin DIN connector, theoretically 100 MB/s in burst. The Cube has four slots; the motherboard occupies one. The NeXTdimension board (Intel i860, 32-bit colour, live video sampling) plugs in here — historically the honest camera-to-pixel path. This lab keeps the camera on the DSP port so the whole journey stays on the main board you can see.",
    modern: "PCIe. Same story: a packetised expansion fabric the GPU and capture card sit on.",
    box: { x: 1.2, y: 58, w: 8.2, h: 32 },
  },
  {
    id: "fpga",
    name: "Glue FPGA",
    part: "Xilinx XC3030",
    maker: "Xilinx",
    role: "Programmable glue logic",
    blurb: "Late-revision glue. FPGAs on 1991 boards were still a flex.",
    detail:
      "An XC3030-class FPGA appears on this revision as programmable glue — boundary logic that did not justify another gate array spin. It is not on the pixel datapath; it is here because the photograph shows it, and because 'the board is allowed to have boring chips' is part of reading hardware.",
    modern: "The always-present companion FPGA, or a CPLD that never quite died.",
    box: { x: 8.2, y: 84.5, w: 9.5, h: 8 },
  },
  {
    id: "bus",
    name: "NeXTbus fabric",
    part: "32-bit multiplexed bus",
    maker: "NeXT",
    clock: "25 MHz",
    role: "The copper that actually moves the frame",
    blurb: "Address and data share the same 32 traces. Burst mode is how 100 MB/s happens.",
    detail:
      "Unlike a modern split-transaction fabric, NeXTbus multiplexes address and data. A master (CPU or ICP) drives an address, then bursts data. Theoretical peak is 32 bits × 25 MHz = 100 MB/s; protocol overhead makes real useful bandwidth lower. Every arrow in this lab that is not an analog cable is a NeXTbus cycle.",
    modern: "The SoC fabric / Infinity Fabric / AMBA. Same job, more parallelism.",
    box: { x: 44.6, y: 38.5, w: 3.2, h: 42 },
  },
  {
    id: "camera",
    name: "Camera / sensor",
    part: "8-bit gray ADC on DSP port",
    maker: "Virtual peripheral",
    role: "Turns photons into a raster the Cube can name",
    blurb: "Not factory hardware. A stand-in for a DSP-port ADC or a NeXTdimension live-video feed.",
    detail:
      "NeXT did not ship a webcam. 1991 options were: a SCSI scanner (still), a third-party video digitiser, or the NeXTdimension's live video input. We inject a grayscale frame here so the rest of the journey can be real silicon: DSP host port → SRAM → ICP DMA → RAM → 68040 → framebuffer → CRT.",
    modern: "A CMOS sensor + ISP inside a laptop lid, or getUserMedia in the browser.",
    box: { x: 38, y: 1.2, w: 18, h: 4.2 },
    virtual: true,
    pin: "in",
  },
  {
    id: "monitor",
    name: "MegaPixel Display",
    part: "17\" 1120×832 @ 68 Hz",
    maker: "NeXT",
    role: "The phosphor that makes a byte into a pixel",
    blurb: "Four shades of gray, a US-letter page at 1:1, and Display PostScript behind the glass.",
    detail:
      "The 17-inch MegaPixel is the reason the framebuffer is 1120×832 and 2-bit. 68 Hz keeps flicker down on phosphor that is slightly slow. What you see in the lab's CRT is a 2-bit posterised version of the camera frame — the same reduction Window Server would impose on a photograph in 1991.",
    modern: "A 2540×1440 LCD over DisplayPort, or the 5K studio display. Still just a framebuffer being scanned.",
    box: { x: 90.4, y: 44, w: 8.4, h: 8 },
    virtual: true,
    pin: "out",
  },
  {
    id: "remote",
    name: "Remote viewer",
    part: "Peer Cube / modern client",
    maker: "The other end of 10BASE-T",
    role: "Reassemble tiles, ACK, paint a copy of the MegaPixel",
    blurb: "A second framebuffer, filled only with packets that survived the wire.",
    detail:
      "Desktop sharing is just the pixel path in reverse plus a network. The remote host is modelled as another 68040-class machine: its 82586 writes good frames into RAM, TCP ACKs them, a tiny decompressor undoes XOR-delta + RLE, and its own MegaPixel paints the result. Dropped packets leave holes until a retransmit lands — the ancestor of every frozen Zoom tile.",
    modern: "A Zoom/Teams/Slack window. Same pipeline: jitter buffer, decode, present, send ACKs or NACKs.",
    box: { x: 90.4, y: 70, w: 8.4, h: 9 },
    virtual: true,
    pin: "out",
  },
];

export const CHIP_MAP: Record<ChipId, Chip> = Object.fromEntries(
  CHIPS.map((c) => [c.id, c]),
) as Record<ChipId, Chip>;

export const CPU_UNITS: {
  id: CpuUnit;
  name: string;
  spec: string;
  blurb: string;
}[] = [
  {
    id: "icache",
    name: "Instruction cache",
    spec: "4 KB, burst fill",
    blurb: "Holds the inner loop of the 2-bit quantiser and the RLE encoder. A miss stalls the IU for a NeXTbus line fill.",
  },
  {
    id: "dcache",
    name: "Data cache",
    spec: "4 KB, write-back",
    blurb: "Too small for a frame. The 68040 streams pixels through it; dirty lines write back as the window slides.",
  },
  {
    id: "mmu",
    name: "PMMU",
    spec: "On-chip, demand paged",
    blurb: "Translates the Window Server's virtual framebuffer mapping into the physical display DRAM and SIMM pages the ICP was programmed with.",
  },
  {
    id: "iu",
    name: "Integer unit",
    spec: "~20 MIPS @ 25 MHz",
    blurb: "Does the real work: 8-bit to 2-bit packing, XOR against the previous frame, RLE runs, TCP checksums.",
  },
  {
    id: "fpu",
    name: "Floating-point unit",
    spec: "On-chip, 68040 FPU",
    blurb: "Optional 3×3 convolution / gamma. The 68040 finally swallowed the 68882; no extra PGA for math.",
  },
];

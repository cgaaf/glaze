// The types rx-tsc checks .rx against: as .rx writes the call, with plain values where ./orb.d.rx says `ref`.
export declare function createOrb(
  canvas: HTMLCanvasElement | undefined,
  options: {
    state: "thinking" | "working" | "searching" | "listening" | "composing";
    tone: "mono" | "spectrum";
    level: number;
    paused: boolean;
  },
): void;

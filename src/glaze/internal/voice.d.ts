// The types rx-tsc checks .rx against: as .rx writes the call, with plain values where ./voice.d.rx says `ref`.
export declare function createMicrophoneLevel(
  active: boolean,
): [number, "off" | "asking" | "live" | "blocked"];

// Stands in for a voice in the demos: a level from 0 to 1 that rises and falls like speech, with pauses
// between phrases. An app passes a real level instead, such as the one from createMicrophoneLevel.
import { createEffect, createSignal } from "solid-js";

export function createDemoVoice(active) {
  const [level, setLevel] = createSignal(0);
  createEffect(active, (on) => {
    if (!on) return;
    let frame = 0;
    let smooth = 0;
    const read = (ms) => {
      const time = ms / 1000;
      const phrase = Math.max(0, Math.sin(time * 0.9) * 0.5 + 0.55);
      const syllable = 0.5 + 0.5 * Math.sin(time * 9.5 + Math.sin(time * 2.3) * 2);
      smooth += (Math.min(1, phrase * (0.35 + 0.65 * syllable)) - smooth) * 0.18;
      setLevel(Math.round(smooth * 100) / 100);
      frame = requestAnimationFrame(read);
    };
    frame = requestAnimationFrame(read);
    return () => {
      cancelAnimationFrame(frame);
      setLevel(0);
    };
  });
  return level;
}

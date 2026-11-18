// A microphone's loudness as a number a voice ring, voice glow or thinking orb can follow. `.rx` can't reach
// `navigator` or the Web Audio API, so it lives here and ./voice.d.rx declares how `.rx` may call it.
import { createEffect, createSignal } from "solid-js";

/**
 * The microphone's level, from 0 to 1, while `active` is true. The browser asks for permission the first time.
 * `status` says where that stands: "off", "asking", "live", or "blocked" when the microphone was refused or
 * there is none. Turning `active` off releases the microphone.
 */
export function createMicrophoneLevel(active) {
  const [level, setLevel] = createSignal(0);
  const [status, setStatus] = createSignal("off");
  createEffect(active, (on) => {
    if (!on) return;
    // An insecure origin has no `mediaDevices`, and a browser may have no microphone API at all.
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("blocked");
      return () => setStatus("off");
    }
    let stopped = false;
    let frame = 0;
    let stream;
    let audio;
    setStatus("asking");
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((granted) => {
        if (stopped) {
          for (const track of granted.getTracks()) track.stop();
          return;
        }
        stream = granted;
        audio = new AudioContext();
        const analyser = audio.createAnalyser();
        analyser.fftSize = 1024;
        audio.createMediaStreamSource(stream).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        let smooth = 0;
        const read = () => {
          analyser.getFloatTimeDomainData(samples);
          let sum = 0;
          for (const sample of samples) sum += sample * sample;
          // Speech at arm's length has a root mean square near 0.05 to 0.2. Rise fast, fall slowly.
          const loud = Math.min(1, Math.sqrt(sum / samples.length) * 6);
          smooth += (loud - smooth) * (loud > smooth ? 0.5 : 0.12);
          setLevel(Math.round(smooth * 100) / 100);
          frame = requestAnimationFrame(read);
        };
        setStatus("live");
        read();
      })
      .catch(() => {
        if (!stopped) setStatus("blocked");
      });
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      if (stream) for (const track of stream.getTracks()) track.stop();
      void audio?.close();
      setLevel(0);
      setStatus("off");
    };
  });
  return [level, status];
}

// The thinking orb: dots on a sphere, drawn on a canvas. `.rx` can't reach `document`, loops or `Math`, so the
// drawing lives here and ./orb.d.rx declares how thinking-orb.rx may call it.
//
// Every orb on the page shares one animation frame. An orb that is off screen, or whose page is hidden, isn't
// drawn. Under `prefers-reduced-motion` an orb holds one still frame and redraws only when its state, size or
// colors change.
import { createEffect } from "solid-js";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const TILT_COS = Math.cos(0.38);
const TILT_SIN = Math.sin(0.38);
const BLEND_MS = 520;
const STILL_AT = 1.4;

/** Radians a second each state turns the sphere. */
const SPIN = { thinking: 0.55, working: 1.1, searching: 0.4, listening: 0.3, composing: 0.15 };

/**
 * Where a dot sits in each state, written into `out` as x, y, z and brightness. A dot's home is a point on the
 * unit sphere; a state moves it from there.
 */
const PLACE = {
  // A slow wave travels pole to pole.
  thinking(dot, time, _level, out) {
    const k = 1 + 0.07 * Math.sin(dot.y * 4 - time * 2.2);
    out[0] = dot.x * k;
    out[1] = dot.y * k;
    out[2] = dot.z * k;
    out[3] = 1;
  },
  // Each dot breathes in and out on its own clock, so the sphere churns.
  working(dot, time, _level, out) {
    const k = 0.62 + 0.42 * (0.5 + 0.5 * Math.sin(time * 2.6 + dot.seed * 40));
    out[0] = dot.x * k;
    out[1] = dot.y * k;
    out[2] = dot.z * k;
    out[3] = 1;
  },
  // A bright band sweeps down the sphere and the rest dims.
  searching(dot, time, _level, out) {
    const band = Math.max(0, Math.cos(dot.y * 3.2 - time * 2.4));
    out[0] = dot.x;
    out[1] = dot.y;
    out[2] = dot.z;
    out[3] = 0.3 + 0.7 * band * band * band;
  },
  // Ripples whose height is the voice level.
  listening(dot, time, level, out) {
    const ripple = 0.5 + 0.5 * Math.sin(dot.y * 7 - time * 7);
    const k = 0.86 + level * 0.3 * ripple + 0.03 * Math.sin(time * 1.4);
    out[0] = dot.x * k;
    out[1] = dot.y * k;
    out[2] = dot.z * k;
    out[3] = 1;
  },
  // The dots leave the sphere for three tilted orbits.
  composing(dot, time, _level, out) {
    const lane = dot.index % 3;
    const tilt = (lane - 1) * 0.9;
    const angle = dot.angle + time * (0.9 + lane * 0.35);
    const radius = 0.98 - lane * 0.06;
    const depth = Math.sin(angle) * radius;
    out[0] = Math.cos(angle) * radius;
    out[1] = depth * Math.sin(tilt) * 0.9;
    out[2] = depth * Math.cos(tilt);
    out[3] = 1;
  },
};

function makeDots(count) {
  return Array.from({ length: count }, (_, index) => {
    const y = count > 1 ? 1 - (index / (count - 1)) * 2 : 0;
    const ring = Math.sqrt(1 - y * y);
    const angle = index * GOLDEN_ANGLE;
    const noise = Math.sin(index * 12.9898) * 43758.5453;
    return {
      index,
      angle,
      x: Math.cos(angle) * ring,
      y,
      z: Math.sin(angle) * ring,
      seed: noise - Math.floor(noise),
    };
  });
}

const orbs = new Set();
let frame = 0;

function schedule() {
  if (!frame && orbs.size) frame = requestAnimationFrame(tick);
}

function tick(now) {
  frame = 0;
  for (const orb of orbs) orb.draw(now);
  schedule();
}

function startOrb(canvas, read) {
  const context = canvas.getContext("2d");
  if (!context) return undefined;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const from = [0, 0, 0, 1];
  const to = [0, 0, 0, 1];
  let dots = [];
  let pixels = 0;
  let fill = "";
  let colorKey = "";
  let colorsReadAt = -Infinity;
  let visible = true;
  let dirty = true;
  let state = read().state;
  let previous = state;
  let changedAt = -Infinity;
  let clock = 0;
  let last = 0;
  let drawnKey = "";

  function measure() {
    const size = Math.min(canvas.clientWidth, canvas.clientHeight);
    const next = Math.round(size * Math.min(devicePixelRatio || 1, 3));
    if (next !== pixels) {
      pixels = next;
      canvas.width = canvas.height = next;
      // Enough dots to read as a sphere at this size, and no more than it can show apart.
      dots = makeDots(Math.max(28, Math.min(220, Math.round(size * 2.4))));
      colorKey = "";
    }
    dirty = true;
  }

  // The canvas takes its colors from CSS, so a theme, a color mode or a class can change them at any time and
  // nothing announces it. Reading them twice a second costs one style lookup and catches every cause.
  function readColors(now, tone) {
    if (now - colorsReadAt < 500 && colorKey.startsWith(tone)) return;
    colorsReadAt = now;
    const style = getComputedStyle(canvas);
    const key = [tone, style.color, style.floodColor, style.lightingColor, style.stopColor].join();
    if (key === colorKey) return;
    colorKey = key;
    dirty = true;
    if (tone === "spectrum") {
      const gradient = context.createLinearGradient(0, 0, pixels, pixels);
      gradient.addColorStop(0, style.floodColor);
      gradient.addColorStop(0.5, style.lightingColor);
      gradient.addColorStop(1, style.stopColor);
      fill = gradient;
    } else fill = style.color;
  }

  const orb = {
    draw(now) {
      if (!visible || !pixels) return;
      const options = read();
      if (options.state !== state) {
        previous = state;
        state = options.state;
        changedAt = now;
        dirty = true;
      }
      readColors(now, options.tone);
      const still = options.paused || reducedMotion.matches;
      const blend = still ? 1 : Math.min(1, (now - changedAt) / BLEND_MS);
      if (!still) clock += Math.min(0.1, (now - last) / 1000);
      last = now;
      const key = still ? `${state} ${options.tone} ${options.level}` : "";
      if (still && !dirty && key === drawnKey) return;
      drawnKey = key;
      dirty = false;

      const time = still ? STILL_AT : clock;
      const eased = blend * blend * (3 - 2 * blend);
      const level = Math.max(0, Math.min(1, options.level || 0));
      const turn = time * (SPIN[previous] + (SPIN[state] - SPIN[previous]) * eased);
      const cos = Math.cos(turn);
      const sin = Math.sin(turn);
      const radius = pixels * 0.4;
      const dot = Math.max(pixels * 0.022, 0.7);
      context.clearRect(0, 0, pixels, pixels);
      context.fillStyle = fill;
      for (const point of dots) {
        PLACE[state](point, time, level, to);
        if (eased < 1) {
          PLACE[previous](point, time, level, from);
          for (let axis = 0; axis < 4; axis++)
            to[axis] = from[axis] + (to[axis] - from[axis]) * eased;
        }
        const x = to[0] * cos + to[2] * sin;
        const turned = to[2] * cos - to[0] * sin;
        const y = to[1] * TILT_COS - turned * TILT_SIN;
        const depth = (to[1] * TILT_SIN + turned * TILT_COS + 1.2) / 2.2;
        context.globalAlpha = Math.max(0, Math.min(1, (0.18 + 0.82 * depth) * to[3]));
        context.beginPath();
        context.arc(
          pixels / 2 + x * radius,
          pixels / 2 + y * radius,
          dot * (0.55 + 0.75 * depth),
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    },
  };

  const resized = new ResizeObserver(measure);
  resized.observe(canvas);
  const seen = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    dirty = true;
  });
  seen.observe(canvas);
  const motionChanged = () => {
    dirty = true;
  };
  reducedMotion.addEventListener("change", motionChanged);
  measure();
  orbs.add(orb);
  schedule();
  return () => {
    orbs.delete(orb);
    resized.disconnect();
    seen.disconnect();
    reducedMotion.removeEventListener("change", motionChanged);
  };
}

/**
 * Draws a thinking orb on `canvas` for as long as the calling component lives. `options` is read on every
 * frame, so a new state, tone, level or pause shows without restarting anything.
 */
export function createOrb(canvas, options) {
  let current = { state: "thinking", tone: "mono", level: 0, paused: false };
  createEffect(options, (next) => {
    current = next;
  });
  createEffect(canvas, (element) => (element ? startOrb(element, () => current) : undefined));
}

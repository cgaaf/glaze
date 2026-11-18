// Stands in for a server in the "saving to a server" demos of the form controls (switch, checkbox, radio, toggle,
// slider, number field, button). It keeps settings by key: a save takes 900ms, a load 300ms, and
// `dropNetwork()` makes every save started in the next three seconds fail. Saves are applied in the order they are
// sent, as a server applies requests in the order they arrive; their answers come back after the delay.
const stored = new Map();
let downUntil = 0;

export function dropNetwork() {
  downUntil = Date.now() + 3000;
}

export function loadSetting(key, fallback) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(stored.has(key) ? stored.get(key) : fallback), 300);
  });
}

export function saveSetting(key, value) {
  const down = Date.now() < downUntil;
  if (!down) stored.set(key, value);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (down) reject(new Error("Couldn’t save. The server couldn’t be reached."));
      else resolve(value);
    }, 900);
  });
}

// The message of a failure, which `.rx` can't read off an `unknown`.
export const messageOf = (error) => (error instanceof Error ? error.message : String(error));

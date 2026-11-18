// Stands in for a server in the "items from a server" menu demo: every answer takes 900ms, and `dropNetwork()` makes
// every request started in the next two seconds fail.
const RECENT = ["Budget 2026.xlsx", "Roadmap.md", "Team photo.png", "Notes.txt"];

let downUntil = 0;

export function dropNetwork() {
  downUntil = Date.now() + 2000;
}

function answer(compute) {
  const down = Date.now() < downUntil;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (down) reject(new Error("The server couldn't be reached."));
      else resolve(compute());
    }, 900);
  });
}

/** The recently opened files. */
export function loadRecent() {
  return answer(() => [...RECENT]);
}

/** Opens `name`: answers it once the server has. */
export function openFile(name) {
  return answer(() => name);
}

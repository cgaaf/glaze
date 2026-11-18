// Stands in for a server in the "content from a server" popover demo: the answer takes 900ms, and
// `failNextLoad()` makes the next one fail, so the error and the retry can be tried.
const MESSAGES = [
  "Your export is ready to download.",
  "Two people commented on Roadmap.md.",
  "Storage is 80% full.",
];
let failLoad = false;

export function failNextLoad() {
  failLoad = true;
}

/** The unread notifications. */
export function loadNotifications() {
  const fail = failLoad;
  failLoad = false;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error("Notifications couldn't be loaded."));
      else resolve([...MESSAGES]);
    }, 900);
  });
}

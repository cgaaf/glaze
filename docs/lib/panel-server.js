// Stands in for a server in the "content that loads" demos of the disclosure families (tabs, accordion): it answers
// a topic's text after 800ms, and `failNextLoad()` makes the next answer a failure, so the error and the retry can be
// tried.
const TEXTS = {
  activity: "Four tasks were closed this week, and two new ones were added to the backlog.",
  members: "Six people can edit this project. Two invitations are waiting for an answer.",
  files: "Twenty-three files, the newest a revised budget uploaded this morning.",
  shipping:
    "Orders leave the warehouse within two working days, and arrive three to five days later.",
  returns:
    "Anything unused can be sent back within thirty days, and the refund follows within a week.",
  warranty: "Every item is covered for two years against faults in materials and workmanship.",
};
let failNext = false;

export function failNextLoad() {
  failNext = true;
}

export function loadText(topic) {
  const fail = failNext;
  failNext = false;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error("Couldn’t load this. The server couldn’t be reached."));
      else resolve(TEXTS[topic] ?? "");
    }, 800);
  });
}

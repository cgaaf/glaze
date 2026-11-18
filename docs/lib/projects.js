// Stands in for a server in the "content from a server" dialog demo: every answer takes 900ms, and `failNextSave()`
// makes the next save fail, so the error and a second try can be seen.
let name = "Website redesign";
let failSave = false;

export function failNextSave() {
  failSave = true;
}

function answer(compute, fail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error("The project couldn't be saved. Try again."));
      else resolve(compute());
    }, 900);
  });
}

/** The project's current name and when it last changed. */
export function loadProject() {
  return answer(() => ({ name, edited: "Edited 3 days ago" }));
}

/** Renames the project: answers the saved name. */
export function saveProject(next) {
  const fail = failSave;
  failSave = false;
  return answer(() => {
    name = next;
    return next;
  }, fail);
}

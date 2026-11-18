// A stand-in for a server that takes a moment to answer. It refuses the usernames it already has, as a server
// returning field errors would, and fails like a dropped connection for "offline".
const taken = new Set(["admin", "studio"]);

export const createAccount = (values) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (values.username === "offline") reject(new Error("Couldn’t reach the server. Try again."));
      else if (taken.has(values.username))
        resolve({ username: `“${values.username}” is already taken` });
      else resolve(undefined);
    }, 1200);
  });

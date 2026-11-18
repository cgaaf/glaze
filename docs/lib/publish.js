// Stands in for a request to a server in the promise demo: it settles after a moment, and every other call fails
// so both outcomes can be seen (a retry after a failure goes through).
let calls = 0;

export function publishPost() {
  calls += 1;
  const fails = calls % 2 === 0;
  return new Promise((resolve, reject) => {
    setTimeout(
      () => (fails ? reject(new Error("offline")) : resolve("/posts/spring-update")),
      1500,
    );
  });
}

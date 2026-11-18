// Stands in for a request in the loading demo: calls `done` after `ms` milliseconds.
export function after(ms, done) {
  setTimeout(() => done(), ms);
}

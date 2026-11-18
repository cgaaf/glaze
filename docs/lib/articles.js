// Stands in for a server in the "content from a server" navigation menu demo: every answer takes 900ms, and
// `dropNetwork()` makes every request started in the next two seconds fail.
const ARTICLES = {
  guides: [
    { title: "Installation", href: "?page=installation" },
    { title: "Theming", href: "?page=theming" },
  ],
  components: [
    { title: "Button", href: "?component=button" },
    { title: "Form", href: "?component=form" },
  ],
};

let downUntil = 0;

export function dropNetwork() {
  downUntil = Date.now() + 2000;
}

/** The articles filed under `topic`. */
export function loadArticles(topic) {
  const down = Date.now() < downUntil;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (down) reject(new Error("The server couldn't be reached."));
      else resolve([...(ARTICLES[topic] ?? [])]);
    }, 900);
  });
}

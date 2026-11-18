// The docs site on Cloudflare: `pnpm deploy:docs` builds dist/docs and uploads it as an assets-only Worker
// (no server code, so it runs on the free plan). Read by the `cf` CLI; a plain object, so the repo needs no
// `cf` dependency to hold it.
export default {
  worker: {
    name: "glaze-ui-docs",
    compatibilityDate: "2026-11-18",
    domains: ["glaze-ui.dev"],
  },
};

declare module "*.rx" {
  const program: (
    app: ReturnType<typeof import("@reactivescript/runtime").createApp>,
  ) => () => unknown;
  export default program;
}

declare module "*?highlighted" {
  /** The file highlighted as HTML (vite.config.ts). */
  const html: string;
  export default html;
  /** The docs/lib modules the file imports: `wait` for `./wait.js`. */
  export const helpers: string[];
}

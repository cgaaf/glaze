declare module "*.rx" {
  const program: (
    app: ReturnType<typeof import("@reactivescript/runtime").createApp>,
  ) => () => unknown;
  export default program;
}

declare module "*.rx?source" {
  const source: string;
  export default source;
}

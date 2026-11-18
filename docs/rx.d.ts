declare module "*.rx" {
  const program: (
    app: ReturnType<typeof import("@reactivescript/runtime").createApp>,
  ) => () => unknown;
  export default program;
}

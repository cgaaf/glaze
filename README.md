# Glaze

Glaze is a styled component library for ReactiveScript. It adds Tailwind CSS styles, semantic theme tokens, Geist and Lucide icons to all 51 Bisque component families. Bisque supplies keyboard interaction, form behavior, accessibility attributes and native popup positioning.

## Documentation

```sh
pnpm install
pnpm docs
```

Every component page includes live examples with copyable ReactiveScript source and an API reference. Use the table of contents to jump to an example. On the Button page, try “Sending a request” to see pending, failure and retry states. Select a swatch on the overview page or use **Theme** in the header to change the entire site. The docs remember the palette and color mode between visits.

## Use Glaze in an app

Glaze currently installs from a local package. Run `pnpm pack` in this repository, then run these commands in a ReactiveScript app, substituting the path to the resulting tarball.

```sh
pnpm add /path/to/glaze-ui-0.1.0.tgz @reactivescript/runtime solid-js @solidjs/web
pnpm add -D @reactivescript/compiler @reactivescript/language-server @solidjs/vite-plugin vite tailwindcss @tailwindcss/vite
pnpm exec glaze copy src/ui
```

The installer writes editable source to `src/ui/glaze` and its pinned Bisque dependency to `src/ui/bisque`. It requires a new destination. To upgrade, copy to a fresh directory and compare or merge your edits. ReactiveScript 0.3.1 resolves these modules by relative path.

Enable both `tailwind()` from `@tailwindcss/vite` and `solid()` from `@solidjs/vite-plugin` in Vite. Import a stylesheet containing both imports below from your application entry.

```css
@import "tailwindcss";
@import "glaze-ui/styles.css";
```

```rx
import { Button } from "./ui/glaze/button.rx"
import { Icon } from "./ui/glaze/icon.rx"

export default component App() {
  source count := 0
  <Button onClick={() => { count := count + 1 }}>
    <Icon name="plus" /> Add one
  </Button>
  <output>{count}</output>
}
```

Exclude `**/*.d.rx` in the tsconfig read by `rx-tsc`. Use the Glaze family module for component parts. For headless contexts, types, and behavior functions, import from the adjacent Bisque tree. Date and time families use `Temporal`. The docs conditionally load `temporal-polyfill/full/global` on browsers that need it.

For Combobox and Autocomplete, place the input and its optional trigger or clear button directly inside `InputGroup` from `./ui/glaze/input-group.rx`. It reserves space for the actions inside the field and keeps the popup aligned with the field. The docs include a complete example for each.

## Design rules

Every part keeps its Bisque name, so `DialogTrigger` in Bisque is `DialogTrigger` in Glaze. Glaze adds only what a styled library needs: `Icon`, `InputGroup`, `SegmentedControl`, and the footer parts `DialogFooter`, `AlertDialogFooter`, `DrawerFooter` and `PopoverFooter`. The same few rules apply to every family.

- **Actions.** `Button` and every part that renders a button (dialog, alert dialog, drawer and popover triggers and close buttons, `MenuTrigger`, `FileUploadTrigger`, `ToastAction`) take the same `variant` and `size`. Triggers and close buttons default to `outline`. Give a view one `default` action and put it last in the footer. Use `ghost` for Cancel and `destructive` to confirm a deletion. `MenuItem` and `ContextMenuItem` take `variant="destructive"` too.
- **Size and shape.** Controls are 2.25rem tall, 1.75rem at `size="sm"`. Controls use `--radius` and surfaces use a slightly larger radius derived from it.
- **Spacing.** Leave 0.5rem between a label and its control, 1rem between fields, and 1.25rem above a footer.
- **Focus.** Text fields draw a solid 2px `--ring` outline over their border, so they keep their footprint. Everything else gets a 2px `--ring` outline, 2px away.
- **Motion.** A dialog scales up slightly and sharpens as it opens while the page behind blurs and dims lightly. A drawer slides in from its edge. Anchored popups move a few pixels from their anchor. Under `prefers-reduced-motion` nothing moves.
- **Disabled.** 55% opacity and a not-allowed cursor.
- **Scrollbars.** Any part that scrolls shows a thin scrollbar colored by `--scrollbar-thumb` and `--scrollbar-track`. Parts that show scrolling another way hide it: the scroll area draws its own, and time picker columns move with the arrow keys. Use the `scrollbar-thin` and `scrollbar-none` utilities on your own containers. The thumb gets stronger under `prefers-contrast: more`.

## Themes

The library defaults to Porcelain and the system color scheme. Select a preset using `data-glaze-theme="celadon"`, `"terracotta"`, `"cobalt"` or `"porcelain"`. Set `data-glaze-mode="light"` or `"dark"` to choose an explicit appearance. The attributes can live on the document or on a section.

Define a custom theme after importing the library. The same tokens drive component rules and Tailwind utilities such as `bg-primary` and `text-primary-foreground`.

```css
[data-glaze-theme="plum"] {
  --primary: light-dark(#6a365e, #e0afd2);
  --primary-foreground: light-dark(white, #32172d);
  --ring: var(--primary);
  --radius: 0.65rem;
}
```

The full token list is in [styles/theme.css](styles/theme.css). Parts expose stable selectors such as `[data-glaze="dialog-popup"]`. Tailwind utility classes can override component defaults. The stylesheet includes a locally served Geist variable font and a selection of Lucide SVGs. Add an accessible label to an icon-only control.

## Verification

```sh
pnpm check
pnpm exec playwright install
pnpm test:browser
```

The first command runs Oxfmt, type-aware Oxlint, Tailwind design rules, both type checkers and a production docs build. The design check passes literal ReactiveScript classes and CSS `@apply` lists to `@shadcn/lint`. It rejects raw Tailwind palette colors and arbitrary utility values. `rx-tsc` checks ReactiveScript and `tsrs` checks TypeScript.

Browser checks load every documented family from the production build, then exercise keyboard interaction, forms, theme persistence and mobile navigation. Chromium is the default. Set `BROWSER=firefox` or `BROWSER=webkit` to run the same suite in another engine.

Glaze targets current Chrome, Firefox and Safari, following Bisque. It uses native dialogs and popovers, CSS anchor positioning and modern color functions. Package preparation adds an ownership boundary around the pinned Bisque submenu provider so nested menus can mount in production Solid builds. The docs use the same prepared source shipped in the tarball.

The component examples and Bisque API descriptions are adapted from Bisque under its MIT license. Lucide's license is included with the SVG assets.

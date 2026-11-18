# Glaze

Glaze is a styled component library for ReactiveScript. It adds Tailwind CSS styles, semantic theme tokens, Geist and Lucide icons to all 51 Bisque component families. Bisque supplies keyboard interaction, form behavior, accessibility attributes and native popup positioning. Glaze also draws three families of its own for AI and voice interfaces: a thinking orb, a voice ring and a voice glow.

## Documentation

```sh
pnpm install
pnpm docs
```

Every component page includes live examples with copyable ReactiveScript source and an API reference. Use the table of contents to jump to an example. On the Button page, try “Sending a request” to see pending, failure and retry states. Select a tile on the overview page or use **Theme** in the header to change the entire site: eight palettes, three finishes, the color mode and the shape tokens. The docs remember your choices between visits.

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

## Agent skill

The package ships a `glaze-ui` [agent skill](https://agentskills.io) that teaches coding agents how to set up Glaze, compose its parts, pick variants and theme an app. pnpm 12.11 or later links a dependency's skills into your agent directories (`.claude/skills`, `.agents/skills`, `.cursor/skills` and others) after you approve them.

```sh
pnpm approve
```

Choose `glaze-ui`. pnpm records the approval under `permissions` in `pnpm-workspace.yaml` and links the skill on every install. It links only into agent directories that already exist at the workspace root, unless it detects the agent running it. A tarball is approved by its exact source, so pnpm may ask again when you install a new one. Skills from Bisque are not linked, because Glaze copies Bisque instead of depending on it. With another package manager, copy `node_modules/glaze-ui/skills/glaze-ui` into your agent's skills directory.

## Design rules

Every part keeps its Bisque name, so `DialogTrigger` in Bisque is `DialogTrigger` in Glaze. Glaze adds only what a styled library needs: `Icon`, `InputGroup`, `SegmentedControl`, `Textarea`, the footer parts `DialogFooter`, `AlertDialogFooter`, `DrawerFooter` and `PopoverFooter`, and the AI and voice parts `ThinkingOrb`, `ThinkingStatus`, `VoiceRing` and `VoiceGlow`. The same few rules apply to every family.

- **Actions.** `Button` and every part that renders a button (dialog, alert dialog, drawer and popover triggers and close buttons, `MenuTrigger`, `FileUploadTrigger`, `ToastAction`) take the same `variant` and `size`. Triggers and close buttons default to `outline`. Give a view one `default` action and put it last in the footer. Use `ghost` for Cancel and `destructive` to confirm a deletion. `MenuItem` and `ContextMenuItem` take `variant="destructive"` too.
- **Size and shape.** Controls are 2.25rem tall, 1.75rem at `size="sm"`. Controls use `--radius` and surfaces use a slightly larger radius derived from it.
- **Spacing.** Leave 0.5rem between a label and its control, 1rem between fields, and 1.25rem above a footer.
- **Focus.** Text fields draw a solid 2px `--ring` outline over their border, so they keep their footprint. Everything else gets a 2px `--ring` outline, 2px away.
- **Motion.** A dialog scales up slightly and sharpens as it opens while the page behind blurs and dims lightly. A drawer slides in from its edge. Anchored popups move a few pixels from their anchor. Under `prefers-reduced-motion` nothing moves.
- **Surfaces.** What floats (dialogs, drawers, popovers, menus, toasts) is made of `--glass`. Controls and panels are filled with `--surface`. Both are the card color at an opacity the finish sets, so in matte they are solid.
- **Color.** `--primary` marks the main action and what is selected. `--accent` is for status and secondary marks: a meter, today in a calendar. The three glow hues color the thinking orb, the voice ring and glow, and the wash.
- **Disabled.** 55% opacity and a not-allowed cursor.
- **Scrollbars.** Any part that scrolls shows a thin scrollbar colored by `--scrollbar-thumb` and `--scrollbar-track`. Parts that show scrolling another way hide it: the scroll area draws its own, and time picker columns move with the arrow keys. Use the `scrollbar-thin` and `scrollbar-none` utilities on your own containers. The thumb gets stronger under `prefers-contrast: more`.

## Themes

A theme is two independent choices and a few numbers.

- **Palette**, `data-glaze-theme`: `porcelain` (the default), `celadon`, `terracotta`, `cobalt`, `raku`, `oxblood`, `majolica` or `kintsugi`. A palette is a primary color, an accent and three glow hues. The neutrals lean toward the palette, so backgrounds and borders are never plain grey.
- **Finish**, `data-glaze-finish`: how much color and glass the surfaces carry. `matte` (the default) keeps every surface solid. `satin` turns what floats into glass you can see through, and adds a soft wash behind the page and a light sheen on the primary action. `gloss` lets controls and panels show the page too, and gives primary actions a glow.
- **Color mode**, `data-glaze-mode`: `light` or `dark`. Without it the system setting decides.

Each attribute can sit on the document or on a section.

```html
<html data-glaze-theme="raku" data-glaze-finish="satin">
```

Define a custom theme after importing the library. The same tokens drive component rules and Tailwind utilities such as `bg-primary`, `text-accent` and `bg-glass`. A palette that sets only `--primary` works: the accent, the glow hues and the tint follow it until you set them. A page with no theme attribute is Porcelain, so a `--primary` set on a bare `:root` keeps Porcelain's blue accent and glow: name your theme as below, or set those too.

```css
[data-glaze-theme="plum"] {
  --primary: light-dark(#6a365e, #e0afd2);
  --primary-foreground: light-dark(white, #32172d);
  --accent: light-dark(#2f6f6a, #9bd8d1);
  --accent-foreground: light-dark(white, #0f302d);
  --radius: 0.65rem;
}
```

A finish is six numbers, so you can set your own in place of a preset.

```css
:root {
  --tint-strength: 6; /* how far the neutrals lean toward the palette: 0 is grey */
  --glass-opacity: 0.8; /* floating layers: 1 is solid */
  --glass-blur: 10px;
  --surface-opacity: 1; /* controls and panels */
  --wash: 0.3; /* the page's ambient color */
  --sheen: 0.06; /* the highlight on the primary action */
}
```

The neutrals, `--surface` and `--glass` are mixed from the palette and the finish. Set palette tokens on `:root` or an element with `data-glaze-theme`, and finish tokens on `:root` or an element with `data-glaze-finish`, so the mix is made again there. Use the `glass` utility on your own floating surfaces, such as a sticky header, and `wash` on the element that holds the page background. Under `prefers-reduced-transparency`, `prefers-contrast: more` or forced colors, every finish is solid, including numbers of your own.

The full token list is in [styles/theme.css](styles/theme.css). Parts expose stable selectors such as `[data-glaze="dialog-popup"]`. Tailwind utility classes can override component defaults. The stylesheet includes a locally served Geist variable font and a selection of Lucide SVGs. Add an accessible label to an icon-only control.

## AI and voice

Three families have no Bisque counterpart. They take their colors from the theme, hold still under `prefers-reduced-motion`, and are hidden from assistive technology unless you pass a `label`.

```rx
import { ThinkingStatus } from "./ui/glaze/thinking-orb.rx"
import { VoiceRing } from "./ui/glaze/voice-ring.rx"
import { createMicrophoneLevel } from "./ui/glaze/internal/voice.js"

export default component Assistant() {
  source listening := false
  [level, status] = createMicrophoneLevel(listening)
  <ThinkingStatus state="searching">Searching the kiln log…</ThinkingStatus>
  <VoiceRing state={status == "live" ? "listening" : "idle"} level={level} />
  <button onClick={() => { listening := !listening }}>{listening ? "Stop" : "Listen"}</button>
}
```

- `ThinkingOrb` is a canvas of dots on a sphere with five states: `thinking`, `working`, `searching`, `listening` and `composing`. `ThinkingStatus` puts a small orb beside a shimmering line of text in a live region.
- `VoiceRing` is a ring of light with four states: `idle`, `listening`, `speaking` and `processing`. It is drawn in CSS and follows a `level` from 0 to 1.
- `VoiceGlow` is a surface whose bottom edge lights up with the same `level`. Put a `Textarea` and its buttons inside it.
- `createMicrophoneLevel` returns a microphone's level and whether the browser allowed it. Pass any other level you have, such as the loudness of the reply being spoken.

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

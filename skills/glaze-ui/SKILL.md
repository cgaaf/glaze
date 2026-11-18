---
name: glaze-ui
description: Build UI in a ReactiveScript (.rx) app with glaze-ui, the styled, themeable component library that wraps every Bisque part with Tailwind CSS styles and semantic theme tokens (Button, Dialog, Drawer, Popover, Menu, Select, Combobox, Field, Form, Tabs, Toast and more). Use when adding or composing Glaze parts, choosing a button variant or size, laying out a dialog or popover footer, showing that an assistant is thinking or a voice is active (thinking orb, voice ring, voice glow), choosing a palette or finish, theming or restyling components, writing Tailwind classes beside them, or when an app's code imports from a copied `glaze` folder.
license: MIT
---

# Using Glaze in an app

Glaze is Bisque with styles. Bisque is the headless layer: each part renders one native element with the right
ARIA, keyboard and focus behavior. Glaze wraps every Bisque part under the same name and adds Tailwind CSS
styles, semantic theme tokens, the Geist font and Lucide icons. So a Glaze app needs no component CSS of its own:
compose the parts, pick variants, and let the theme tokens do the coloring. Both are experimental, like
ReactiveScript 0.3: trust the copied source over memory.

## Find the part before writing it

1. Every part keeps its Bisque name: `DialogTrigger` in Bisque is `DialogTrigger` in Glaze, with the same props
   and behavior. What you know about a Bisque part holds for the Glaze one.
2. Each family is one file in the app's copy, `<copy>/glaze/<family>.rx` (`dialog.rx`, `alert-dialog.rx`,
   `number-field.rx`). List the folder to see every family, and read the family file for its parts. Don't guess
   part or prop names.
3. A Glaze part's props are its Bisque part's props, so the types, defaults, `data-*` attributes and behavior
   are in the adjacent Bisque source, `<copy>/bisque/<family>/<family>.rx`.
4. Glaze adds only these, which have no Bisque counterpart:

| Addition                                                             | File                              | What it is                                                                               |
| -------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `Icon`                                                               | `icon.rx`                         | A decorative Lucide icon, chosen by `name`.                                              |
| `InputGroup`                                                         | `input-group.rx`                  | Wraps a Combobox or Autocomplete input with its trigger or clear button.                 |
| `SegmentedControlRoot`, `SegmentedControlItem`                       | `segmented-control.rx`            | A radio group drawn as a segmented track. It picks a value; to switch panels, use Tabs.  |
| `DialogFooter`, `AlertDialogFooter`, `DrawerFooter`, `PopoverFooter` | In each family's file             | The row of actions that ends a popup.                                                    |
| `Textarea`                                                           | `input.rx`                        | A multi-line text field that grows with its content.                                     |
| `ThinkingOrb`, `ThinkingStatus`                                      | `thinking-orb.rx`                 | A dot-sphere busy indicator for an assistant, and a pill with the orb and a status line. |
| `VoiceRing`                                                          | `voice-ring.rx`                   | A ring of light that follows a voice level. See [AI and voice](#ai-and-voice).           |
| `VoiceGlow`                                                          | `voice-glow.rx`                   | A surface whose bottom edge lights up with a voice level.                                |
| `variant` and `size`                                                 | On every part that draws a button | The shared emphasis and size scale. See [Actions](#actions-variant-and-size).            |

5. As in Bisque there is no Portal, Positioner, Backdrop or focus-trap part. The top layer, `::backdrop`, `inert`
   and CSS anchor positioning do that work.
6. For a canonical composition of a family, read `node_modules/glaze-ui/docs/examples/<family>.rx`, and
   `node_modules/glaze-ui/docs/examples/<family>/` for its variations (a server-backed dialog, a range
   calendar). Follow them rather than inventing a layout. They are there to read, not to import: their import
   paths point into the package (`../../src/glaze/…`), so write yours to the app's copy, and the `docs/lib`
   modules some of them import are the docs' simulated servers, which the package doesn't ship.

## Setup

ReactiveScript 0.3 resolves an `.rx` import only by relative path, so the library is copied into the app. Glaze
isn't on npm and currently installs from a local tarball made with `pnpm pack` in the Glaze repository. Never
`pnpm dlx glaze-ui`: that would run whatever the registry serves under the name.

```bash
pnpm add /path/to/glaze-ui-0.1.0.tgz @reactivescript/runtime solid-js @solidjs/web
pnpm add -D @reactivescript/compiler @reactivescript/language-server @solidjs/vite-plugin vite tailwindcss @tailwindcss/vite
pnpm exec glaze copy src/ui
```

- The copy writes `src/ui/glaze` (the styled parts) and `src/ui/bisque` (the pinned headless layer they wrap).
- Import parts from the Glaze family file by a path relative to the importing file:
  `import { DialogRoot, DialogTrigger, DialogPopup } from "./ui/glaze/dialog.rx"`. Glaze files are flat, one per
  family. Bisque's are nested, `./ui/bisque/dialog/dialog.rx`.
- Import parts from `glaze`, never from `bisque`: a Bisque part is the same part without its styles. Import from
  the Bisque tree only what Glaze doesn't wrap: contexts, types and the behavior (props) functions.
- Enable both `tailwind()` from `@tailwindcss/vite` and `solid()` from `@solidjs/vite-plugin` in Vite, and import
  a stylesheet from the app's entry that holds both lines, in this order:

```css
@import "tailwindcss";
@import "glaze-ui/styles.css";
```

- The tsconfig that `rx-tsc` reads must exclude the copy's `.d.rx` files: `"exclude": ["**/*.d.rx"]`.
- Date and time families use `Temporal`. Load `temporal-polyfill/full/global` in browsers that lack it.
- `glaze copy` refuses a directory that exists. To upgrade, copy to a fresh directory and compare or merge. The
  copy is yours to edit, but every edit is one to merge again at the next upgrade, so reach for a variant, a
  class or a theme token first.
- Find the copy by searching the app for `glaze/button.rx`.

## Anatomy

Anatomy is Bisque's. A family's `…Root` holds its state and the other parts read it, nested anywhere inside the
Root with your own markup between them. Every part passes `class`, `style`, `id`, `data-*`, `aria-*` and other
attributes on to its element. Every stateful Root works uncontrolled (`defaultOpen`, `defaultValue`) or
controlled (`open` with `onOpenChange`, `value` with `onValueChange`).

```rx
import { DialogRoot, DialogTrigger, DialogPopup, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "./ui/glaze/dialog.rx"
import { Icon } from "./ui/glaze/icon.rx"

export component DeleteProject(props: { onDelete: () => void }) {
  <DialogRoot>
    <DialogTrigger><Icon name="x" /> Delete project</DialogTrigger>
    <DialogPopup>
      <DialogTitle>Delete this project?</DialogTitle>
      <DialogDescription>Its files are removed for everyone.</DialogDescription>
      <DialogFooter>
        <DialogClose variant="ghost">Cancel</DialogClose>
        <DialogClose variant="destructive" onClick={props.onDelete}>Delete</DialogClose>
      </DialogFooter>
    </DialogPopup>
  </DialogRoot>
}
```

No class is needed anywhere in it: the parts arrive styled, spaced and animated.

## Actions: variant and size

One scale, the `ButtonStyle` type in `button.rx`, is shared by `Button` and every part that draws a button.

- `variant`: `"default"` (filled with the primary color), `"secondary"` (muted fill), `"outline"` (bordered),
  `"ghost"` (no border or fill), `"destructive"` (filled with the destructive color), `"link"` (underlined text).
- `size`: `"default"` (2.25rem tall), `"sm"` (1.75rem), `"lg"` (2.75rem), `"icon"` (a 2.25rem square).

| Part                                                                     | Takes             | Default variant |
| ------------------------------------------------------------------------ | ----------------- | --------------- |
| `Button`                                                                 | `variant`, `size` | `default`       |
| `DialogTrigger`, `AlertDialogTrigger`, `DrawerTrigger`, `PopoverTrigger` | `variant`, `size` | `outline`       |
| `DialogClose`, `AlertDialogClose`, `DrawerClose`, `PopoverClose`         | `variant`, `size` | `outline`       |
| `MenuTrigger`, `FileUploadTrigger`, `ToastAction`                        | `variant`, `size` | `outline`       |
| `MenuItem`, `ContextMenuItem`                                            | `variant` only    | none            |

- `MenuItem` and `ContextMenuItem` take only `"default"` or `"destructive"`, to mark an item that deletes or
  discards something.
- No other part takes `variant` or `size`. `SelectTrigger`, `ComboboxTrigger`, `TabsTab` and the rest have one
  look; don't pass them a variant.
- Give a view one `default` action and put it last in the footer. Use `ghost` for Cancel and `destructive` to
  confirm a deletion.
- An action that also closes its popup is a `…Close` part with the action's variant, as above: your `onClick`
  runs before the part closes the popup. An action that must finish first is a `Button` and a controlled Root.
- `Icon` takes `name` and `class` only. `name` is one of the `IconName` union in `icon.rx`, a selection of
  Lucide, not all of it: read the union before choosing. An icon is `aria-hidden`, so give an icon-only control
  a label: `<Button size="icon" variant="ghost" aria-label="Settings"><Icon name="settings" /></Button>`.

## Design rules

The same few rules hold in every family. Match them in the markup you write around the parts.

- **Size and shape.** Controls are 2.25rem tall, 1.75rem at `size="sm"`. Controls use `--radius` (the
  `rounded-control` utility) and surfaces a slightly larger radius derived from it (`rounded-panel`).
- **Spacing.** 0.5rem between a label and its control (`gap-2`), 1rem between fields (`gap-4`), 1.25rem above a
  footer. The footer parts set their own space; don't add a margin to them.
- **Focus.** Text fields draw a solid 2px `--ring` outline over their border, so they keep their footprint.
  Everything else gets a 2px `--ring` outline, 2px away. Don't remove outlines or draw your own.
- **Motion.** A dialog scales up slightly and sharpens as it opens while the page behind blurs and dims lightly.
  A drawer slides in from its edge. Anchored popups move a few pixels from their anchor. Under
  `prefers-reduced-motion` nothing moves. All of it is built in; add none.
- **Disabled.** 55% opacity and a not-allowed cursor.
- **Scrollbars.** Any part that scrolls shows a thin scrollbar colored by `--scrollbar-thumb` and
  `--scrollbar-track`. Parts that show scrolling another way hide it: the scroll area draws its own, and time
  picker columns move with the arrow keys. On your own scroll containers use the `scrollbar-thin` utility, or
  `scrollbar-none` where something else already shows that the content scrolls.
- **Combobox and Autocomplete.** Put the input and its optional trigger or clear button directly inside
  `InputGroup`. It reserves room for the actions inside the field and keeps the popup aligned with the field.
  Keep the input full width: the popup is anchored to its border box.

## AI and voice

Three families Glaze draws itself, for an assistant or a voice interface. Read each family file for its props.

```rx
import { ThinkingStatus } from "./ui/glaze/thinking-orb.rx"
import { VoiceRing } from "./ui/glaze/voice-ring.rx"
import { Button } from "./ui/glaze/button.rx"
import { createMicrophoneLevel } from "./ui/glaze/internal/voice.js"

export default component Assistant() {
  source listening := false
  [level, status] = createMicrophoneLevel(listening)
  <ThinkingStatus state="searching">Searching the kiln log…</ThinkingStatus>
  <VoiceRing state={status == "live" ? "listening" : "idle"} level={level} />
  <Button onClick={() => { listening := !listening }}>{listening ? "Stop" : "Listen"}</Button>
}
```

- `ThinkingOrb` takes `state` (`"thinking"`, `"working"`, `"searching"`, `"listening"`, `"composing"`), `tone`
  (`"mono"` draws in the text color, `"spectrum"` in the theme's glow hues) and `size` (`"sm"`, `"default"`,
  `"lg"`, or a class such as `size-24`). Use `ThinkingStatus` when there is text to show: it is the live
  region, so keep it mounted and change its text and `state` rather than mounting a new one per step.
- `VoiceRing` and `VoiceGlow` take `state` (`"idle"`, `"listening"`, `"speaking"`, `"processing"`) and `level`,
  a number from 0 to 1. `createMicrophoneLevel(active)` gives a microphone's level and a status of `"off"`,
  `"asking"`, `"live"` or `"blocked"`; bind both, and tell the user when it is blocked. While the assistant
  speaks, pass the loudness of its audio instead.
- `VoiceGlow` draws the card itself. Put a `Textarea` or `Input` directly inside it and it drops the field's
  own border and background and shows the field's focus ring on the card.
- These are decoration beside text that says the same thing. Pass `label` only when no such text is shown.
- All three take their colors from the theme. Don't set colors on them except through `class="text-primary"`
  with `tone="mono"`, or the `--glow-1`, `--glow-2` and `--glow-3` tokens.

## Theme tokens

Colors and radii are CSS variables, defined in `node_modules/glaze-ui/styles/theme.css`. Each color is a
`light-dark()` pair, so one token serves both modes, and each is also a Tailwind color.

| Variable                                    | Utilities                                       | Used for                                             |
| ------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `--background`, `--foreground`              | `bg-background`, `text-foreground`              | The page and its text.                               |
| `--card`                                    | `bg-card`                                       | The solid surface color the two below start from.    |
| `--surface`                                 | `bg-surface`                                    | Controls and panels: the card, see-through in gloss. |
| `--glass`                                   | `bg-glass`, `glass`                             | Floating layers: popups, menus, toasts.              |
| `--accent`, `--accent-foreground`           | `bg-accent`, `text-accent-foreground`           | Status and secondary marks. Not for actions.         |
| `--glow-1`, `--glow-2`, `--glow-3`          | `wash`                                          | The orb, the voice ring and glow, the page wash.     |
| `--muted`, `--muted-foreground`             | `bg-muted`, `text-muted-foreground`             | Quiet fills, hover, secondary text.                  |
| `--primary`, `--primary-foreground`         | `bg-primary`, `text-primary-foreground`         | The main action and selected state.                  |
| `--destructive`, `--destructive-foreground` | `bg-destructive`, `text-destructive-foreground` | Deleting and errors.                                 |
| `--border`, `--input`                       | `border-border`, `border-input`                 | Dividers and surface edges; control borders.         |
| `--ring`                                    | `outline-ring`, `ring-ring`                     | Focus. Follows `--primary` by default.               |
| `--radius`                                  | `rounded-control`, `rounded-panel`              | Control radius; panels add 0.3rem.                   |
| `--scrollbar-thumb`, `--scrollbar-track`    | `scrollbar-thin`, `scrollbar-none`              | Scrollbar colors and the two scrollbar tiers.        |
| `--glaze-font`, `--glaze-shadow`            | `font-sans`                                     | Geist, and the shadow under popups.                  |

- That is the whole list of colors. There is no `secondary`, `popover` or `card-foreground` token:
  `variant="secondary"` is drawn with `--muted`, and text on a card is `text-foreground`.
- A theme is two independent choices. The palette, `data-glaze-theme`: `"porcelain"` (the default),
  `"celadon"`, `"terracotta"`, `"cobalt"`, `"raku"`, `"oxblood"`, `"majolica"` or `"kintsugi"`. The finish,
  `data-glaze-finish`: `"matte"` (the default, every surface solid), `"satin"` (floating layers are glass,
  with a soft wash and sheen) or `"gloss"` (controls and panels are see-through too). Appearance follows the
  system; force it with `data-glaze-mode="light"` or `"dark"`. Each attribute can sit on the document or on a
  section.
- A finish is six numbers: `--tint-strength`, `--glass-opacity`, `--glass-blur`, `--surface-opacity`, `--wash`
  and `--sheen`. Set them on `:root` in place of a preset to tune one.
- Give your own floating surface (a sticky header, a command bar) the `glass` utility and a border, and put
  `wash` on the element that holds the page's background color. Don't write `backdrop-blur-*` or a gradient
  yourself: they ignore the finish.
- The neutrals, `--surface` and `--glass` are mixed from the palette and the finish where those are set. So
  set palette tokens on `:root` or an element with `data-glaze-theme`, and finish tokens on `:root` or an
  element with `data-glaze-finish`, not on an arbitrary wrapper.
- A custom theme is a rule after the library's import that sets the tokens it changes. Only `--primary` and
  its foreground are needed; the accent, the glow hues and the tint follow the primary until set. Name the
  theme: a page with no theme attribute is Porcelain, so `--primary` on a bare `:root` keeps Porcelain's blue
  accent and glow.

```css
[data-glaze-theme="plum"] {
  --primary: light-dark(#6a365e, #e0afd2);
  --primary-foreground: light-dark(white, #32172d);
  --accent: light-dark(#2f6f6a, #9bd8d1);
  --accent-foreground: light-dark(white, #0f302d);
  --radius: 0.65rem;
}
```

## Styling and the color rule

- **Theme tokens only.** Never write a raw Tailwind palette color (`bg-blue-500`, `text-zinc-400`,
  `border-red-600`) or an arbitrary value (`w-[37px]`, `bg-[#fafaf9]`, `text-[13px]`) in a class. Use a token
  utility and Tailwind's own scale (`bg-primary`, `text-muted-foreground`, `gap-4`, `max-w-sm`). A raw color
  ignores the theme and breaks in dark mode. Glaze's own source is held to this by lint (`@shadcn/lint`'s
  `no-raw-colors` and `no-arbitrary-values`); hold the app's markup to the same.
- If a design needs a color the tokens lack, add a variable beside the theme with a `light-dark()` pair and map
  it in `@theme inline`, rather than reaching for the palette. Hex values belong in theme rules, nowhere else.
- To adjust one part, pass it a `class`: Tailwind utilities override the component's defaults.
- To restyle a part everywhere, write a rule on its stable selector after the library's import. A part that
  renders an element marks it `data-glaze="<family>-<part>"` (`[data-glaze="dialog-popup"]`,
  `[data-glaze="menu-item"]`), and action parts carry `data-variant` and `data-size`. A Root with no element of
  its own, such as `DialogRoot`, has none.
- State selectors are Bisque's: the platform's where the browser holds the state (`[open]`, `:popover-open`,
  `:checked`, `:user-invalid`, `::backdrop`) and `data-*` where only the library knows (`[data-highlighted]`,
  `[data-popup-open]`, `[data-ending-style]`, `[data-disabled]`).

## Forms and server data

These are Bisque's behavior, unchanged: `FieldRoot` connects a control to its `FieldLabel`, `FieldDescription`
and `FieldError`; `Form` validates on submit and waits for `onFormSubmit`; controls submit through `name`;
`ComboboxRoot`, `AutocompleteRoot` and `SelectRoot` take `loading` while options are on their way. Glaze styles
the invalid state of a field and the empty state of an option list.
For the patterns, read the `server.rx` examples in `node_modules/glaze-ui/docs/examples/<family>/` and
`button/request.rx` beside them, which shows pending, failure and retry on a button.

## Browsers

Current Chrome, Firefox and Safari only, with no fallbacks, following Bisque: native dialogs and popovers, CSS
anchor positioning and modern color functions.

// Syntax highlighting for the docs' code blocks, with ReactiveScript's own TextMate grammar (rx.tmLanguage.json,
// vendored from the VS Code extension) run by Shiki. The build does this (vite.config.ts, `?highlighted`), so a
// page is sent a file's HTML and not Shiki and its grammars. A page must not import this module: theme.ts loads
// it on demand for the one block whose text is only known in the browser.
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { LanguageRegistration, ThemeRegistration } from "shiki/core";
import tsx from "shiki/langs/tsx.mjs";
import css from "shiki/langs/css.mjs";
import shellscript from "shiki/langs/shellscript.mjs";
import rxGrammar from "./rx.tmLanguage.json" with { type: "json" };

const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** The scopes each `tok-…` class in site.css colours. A more specific scope wins over a shorter one. */
const KINDS: Record<string, string[]> = {
  comment: ["comment", "punctuation.definition.comment"],
  string: ["string", "punctuation.definition.string"],
  keyword: [
    "keyword",
    "storage",
    "keyword.operator.assignment.write.rx",
    "constant.language.import-export-all",
  ],
  operator: ["keyword.operator", "keyword.operator.expression", "keyword.operator.new"],
  tag: ["entity.name.tag", "support.class.component"],
  attr: ["entity.other.attribute-name", "support.type.property-name", "variable.css"],
  number: ["constant.numeric", "constant.language", "keyword.other.unit", "constant.other.color"],
  function: ["entity.name.function", "support.function"],
  type: ["entity.name.type", "support.type", "entity.other.inherited-class"],
};

// Each kind's colour is a marker that `highlight` turns back into a class, so the colours stay in the stylesheet
// and follow the page's theme and mode.
const theme: ThemeRegistration = {
  name: "glaze-docs",
  type: "light",
  fg: "",
  bg: "",
  settings: Object.entries(KINDS).map(([kind, scope]) => ({
    scope,
    settings: { foreground: `var(--tok-${kind})` },
  })),
};

/** The vendored grammar is a TextMate grammar; JSON's inferred type is too loose to say so. */
function isGrammar(value: unknown): value is LanguageRegistration {
  return typeof value === "object" && value !== null && "scopeName" in value && "patterns" in value;
}
const rx: unknown = { ...rxGrammar, name: "rx", embeddedLangs: ["tsx", "css"] };
if (!isGrammar(rx)) throw new Error("rx.tmLanguage.json is not a TextMate grammar");

const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  themes: [theme],
  langs: [tsx, css, shellscript, rx],
});

/** The language a file's name says it is in: `button.rx`, `wait.d.rx`, `app.css`, `install.sh`, `page.html`. */
export function languageOf(name: string) {
  if (name.endsWith(".rx")) return "rx";
  if (name.endsWith(".css")) return "css";
  if (/\.([cm]?[jt]sx?|html)$/.test(name)) return "tsx";
  if (name.endsWith(".sh")) return "shellscript";
  return "text";
}

/** `code` as HTML: escaped, with a `<span class="tok-…">` around each token the grammar names. */
export function highlight(code: string, lang: string) {
  if (lang === "text") return escape(code);
  const { tokens } = highlighter.codeToTokens(code, { lang, theme: "glaze-docs" });
  return tokens
    .map((line) =>
      line
        .map(({ content, color }) => {
          const kind = color?.match(/^var\(--tok-(\w+)\)$/)?.[1];
          return kind ? `<span class="tok-${kind}">${escape(content)}</span>` : escape(content);
        })
        .join(""),
    )
    .join("\n");
}

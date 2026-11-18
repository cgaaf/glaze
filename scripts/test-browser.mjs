import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium, firefox, webkit } from "playwright";
import { preview } from "vite";

const families = JSON.parse(readFileSync(new URL("../docs/catalog.json", import.meta.url)));
const server = await preview({ preview: { host: "127.0.0.1", port: 0, open: false } });
const origin = server.resolvedUrls.local[0];
const engine = { chromium, firefox, webkit }[process.env.BROWSER || "chromium"];
let browser;
try {
  browser = await engine.launch(
    process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {},
  );
  const page = await browser.newPage({
    viewport: { width: 1360, height: 960 },
    colorScheme: "light",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(page.url() + " " + error.message));
  const visit = async (query) => {
    await page.goto(origin + query);
    await page.waitForFunction(() => document.title.endsWith(" · Glaze"), undefined, {
      timeout: 10000,
    });
  };
  await visit("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Changes saved" }).waitFor();
  const swatch = page.getByRole("button", { name: "Apply Cobalt theme" });
  await swatch.click();
  assert.equal(await swatch.getAttribute("aria-pressed"), "true");
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.glazeTheme === "cobalt");
  await page.getByRole("button", { name: "Theme", exact: true }).click();
  await page.locator("#mode").selectOption("dark");
  assert.equal(
    await page.locator("html").evaluate((el) => getComputedStyle(el).colorScheme),
    "dark",
  );
  await page.locator("#mode").selectOption("light");
  await page.locator("#palette").selectOption("celadon");
  await page.keyboard.press("Escape");
  if (process.env.SCREENSHOTS)
    await page.screenshot({ path: process.env.SCREENSHOTS + "/glaze-desktop.png" });
  const found = await page.locator("#navigation a[href^='?component=']").count();
  assert.equal(found, Object.keys(families).length);
  for (const [id, meta] of Object.entries(families)) {
    await visit("?component=" + id);
    assert.equal(await page.locator("h1").textContent(), meta.name, id);
    assert.ok(await page.locator("#demo [data-glaze]").count(), id);
    assert.ok(await page.locator(".api details").count(), id);
    const source = await page.locator(".source code").first().textContent();
    assert.ok(source.startsWith("import ") && source.includes("./ui/glaze/"), id);
  }
  await visit("?component=context-menu");
  await page.getByText("Right-click here", { exact: true }).click({ button: "right" });
  const submenu = page.getByRole("menuitem", { name: "Arrange" });
  await submenu.focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("menuitem", { name: "Bring to front" }).waitFor();
  await visit("?component=dialog");
  const opener = page.getByRole("button", { name: "Rename project" });
  await opener.focus();
  await opener.press("Enter");
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("data-glaze") === "dialog-trigger",
    undefined,
    { timeout: 3000 },
  );
  await visit("?component=switch");
  const control = page.getByRole("switch");
  await control.focus();
  const checked = await control.isChecked();
  await page.keyboard.press("Space");
  assert.notEqual(await control.isChecked(), checked);
  await visit("?component=tabs");
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.getByRole("tab", { name: "Activity" }).getAttribute("aria-selected"),
    "true",
  );
  await visit("?component=slider");
  const range = page.getByRole("slider");
  await range.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await range.inputValue(), "41");
  await visit("?component=sortable");
  const handle = page.getByRole("button", { name: "Move Water the plants" });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() =>
    document.querySelector('[data-glaze="sortable-item"]')?.textContent?.includes("Book the venue"),
  );
  await visit("?component=combobox");
  const fruit = page.getByRole("combobox", { name: "Fruit" });
  const fruitMenu = page.locator('[data-glaze="combobox-popup"]');
  await page.getByRole("button", { name: "Show fruits" }).click();
  await fruitMenu.locator('[role="option"]').first().waitFor();
  const inputBox = await fruit.boundingBox();
  const menuBox = await fruitMenu.boundingBox();
  assert.ok(Math.abs(inputBox.x - menuBox.x) < 1 && Math.abs(inputBox.width - menuBox.width) < 1);
  assert.equal(await fruitMenu.getByRole("status").evaluate((el) => el.offsetHeight), 0);
  await fruit.fill("apri");
  const clear = page.getByRole("button", { name: "Clear fruit" });
  const chevronBox = await page.getByRole("button", { name: "Show fruits" }).boundingBox();
  const clearBox = await clear.boundingBox();
  assert.ok(clearBox.x >= inputBox.x && clearBox.x + clearBox.width <= chevronBox.x + 1);
  assert.ok(chevronBox.x + chevronBox.width <= inputBox.x + inputBox.width);
  await fruit.press("ArrowDown");
  await fruit.press("Enter");
  assert.equal(await fruit.inputValue(), "Apricot");
  await fruitMenu.waitFor({ state: "hidden" });
  await fruit.fill("no matching fruit");
  await fruitMenu.getByText("No fruit found.").waitFor();
  await clear.click();
  assert.equal(await fruit.inputValue(), "");
  await fruit.press("Escape");
  await fruitMenu.waitFor({ state: "hidden" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fruit.press("ArrowDown");
  await fruitMenu.waitFor();
  assert.equal(
    await fruitMenu.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
    0,
  );
  await fruit.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await visit("?component=select");
  await page.locator('[data-glaze="select-trigger"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  assert.match(await page.locator('[data-glaze="select-trigger"]').innerText(), /Dark/);
  await visit("?component=form");
  await page.getByRole("textbox", { name: "Email" }).fill("test@example.org");
  await page.getByRole("textbox", { name: "Username" }).fill("test-studio");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText("Account created for test-studio.").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("");
  if (process.env.SCREENSHOTS)
    await page.screenshot({ path: process.env.SCREENSHOTS + "/glaze-mobile.png" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("searchbox").fill("date range");
  assert.equal(await page.locator("#navigation a").count(), 1);
  await page.locator("#navigation a").click();
  await page.getByRole("heading", { name: "Date Range Picker", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    `Verified ${found} live examples, theme persistence, form and keyboard interactions, and mobile navigation.`,
  );
} finally {
  await browser?.close();
  await server.close();
}

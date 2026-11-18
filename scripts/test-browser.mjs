import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium, firefox, webkit } from "playwright";
import { preview } from "vite";

const families = JSON.parse(readFileSync(new URL("../docs/catalog.json", import.meta.url)));
const examples = JSON.parse(readFileSync(new URL("../docs/examples.json", import.meta.url)));
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
  // Tokens besides the palette: applied at once, written into the theme's CSS, and restored on the next load.
  await page.getByRole("slider", { name: "Radius" }).fill("1");
  await page.getByRole("radio", { name: "Serif" }).click();
  await page.getByRole("radio", { name: "Raised" }).click();
  await page.getByRole("radio", { name: "Compact" }).click();
  const themeCss = await page.locator("[data-theme-css] code").textContent();
  // The build's minifier may drop a leading zero.
  for (const line of [/--radius: 1rem;/, /--glaze-font: ui-serif/, /--spacing: 0?\.22rem;/])
    assert.match(themeCss, line);
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.glazeTheme === "cobalt");
  const save = page.getByRole("button", { name: "Save changes" });
  await save.waitFor();
  assert.equal(await save.evaluate((el) => getComputedStyle(el).borderRadius), "16px");
  assert.ok((await save.evaluate((el) => getComputedStyle(el).fontFamily)).startsWith("ui-serif"));
  assert.ok(await page.getByRole("radio", { name: "Raised" }).isChecked());
  await page.getByRole("button", { name: "Reset tokens" }).click();
  assert.equal(await save.evaluate((el) => getComputedStyle(el).borderRadius), "7.2px");
  assert.equal(await page.evaluate(() => localStorage.getItem("glazeRadius")), null);
  await page.getByRole("button", { name: "Theme", exact: true }).click();
  const menu = page.locator(".theme-menu");
  await menu.getByRole("radio", { name: "Dark" }).click();
  assert.equal(
    await page.locator("html").evaluate((el) => getComputedStyle(el).colorScheme),
    "dark",
  );
  await menu.getByRole("radio", { name: "Light" }).click();
  // The menu offers the studio's tokens too, and shows what the studio set.
  assert.equal(
    await menu.getByRole("button", { name: "Cobalt" }).getAttribute("aria-pressed"),
    "true",
  );
  await menu.getByRole("radio", { name: "Mono" }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem("glazeFont")), "mono");
  await menu.getByRole("button", { name: "Reset tokens" }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem("glazeFont")), null);
  await menu.getByRole("button", { name: "Celadon" }).click();
  assert.equal(
    await page.getByRole("button", { name: "Apply Celadon theme" }).getAttribute("aria-pressed"),
    "true",
  );
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
    const outline = page.getByRole("navigation", { name: "Component sections" });
    const sections = ["preview", ...examples[id].map(({ id }) => id), "api-reference"];
    assert.deepEqual(
      await outline.locator("a").evaluateAll((links) => links.map((link) => link.hash.slice(1))),
      sections,
      id,
    );
    for (const demo of await page.locator(".doc-example").all()) {
      assert.ok(await demo.locator(".demo [data-glaze]").count(), id);
      const source = await demo.locator(".source code").first().textContent();
      assert.ok(source.startsWith("import ") && source.includes("./ui/glaze/"), id);
    }
  }
  // The brand mark has its own size, so it can't fill the page while the stylesheet is on its way.
  const bare = await browser.newPage();
  await bare.route("**/*.css", (route) => route.abort());
  await bare.goto(origin, { waitUntil: "domcontentloaded" });
  assert.ok((await bare.locator(".mark").boundingBox()).width <= 32);
  await bare.close();
  await visit("?component=autocomplete");
  // One header for an example's files: the tabs choose the file, and the copy button copies the one shown.
  const files = page.locator(".source:has([role=tab])").first();
  assert.ok(await files.locator(".code-expand").isVisible());
  await files.getByRole("tab", { name: "countries.js" }).click();
  assert.ok(await files.getByRole("tabpanel", { name: "countries.js" }).isVisible());
  assert.equal(await files.getByRole("tabpanel").count(), 1);
  if (engine === chromium) {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await files.getByRole("button", { name: "Copy countries.js" }).click();
    await files.locator("[data-copy][data-copied]").waitFor();
    assert.ok((await page.evaluate(() => navigator.clipboard.readText())).includes("COUNTRIES"));
  }
  await files.locator(".code-expand").click();
  assert.equal(await files.locator(".code-expand").textContent(), "Show less");
  assert.equal(await files.getAttribute("data-collapsed"), null);
  await visit("?component=button");
  const outline = page.getByRole("navigation", { name: "Component sections" });
  const requestLink = outline.getByRole("link", { name: "Sending a request" });
  assert.ok((await outline.boundingBox()).x > (await page.locator("#demo").boundingBox()).x);
  if (process.env.SCREENSHOTS)
    await page.screenshot({ path: process.env.SCREENSHOTS + "/glaze-component-desktop.png" });
  await requestLink.click();
  assert.equal(new URL(page.url()).hash, "#request");
  await page.waitForFunction(
    () =>
      document.querySelector('#contents a[href="#request"]')?.getAttribute("aria-current") ===
      "location",
  );
  await page.reload();
  await requestLink.waitFor();
  const request = page.locator("#demo-request");
  const send = request.getByRole("button", { name: "Send reminder" });
  await request.getByRole("button", { name: "Drop the network for 3 seconds" }).click();
  await send.click();
  const pending = request.getByRole("button", { name: "Sending" });
  assert.equal(await pending.getAttribute("aria-busy"), "true");
  assert.equal(await pending.getAttribute("aria-disabled"), "true");
  await pending.press("Enter");
  await request.getByText("Couldn’t save. The server couldn’t be reached.").waitFor();
  // The simulated outage lasts three seconds from the press.
  await page.waitForTimeout(3000);
  await send.click();
  await request.getByText("1 sent", { exact: true }).waitFor();
  await page.locator("#loading").evaluate((heading) => heading.scrollIntoView());
  await page.waitForFunction(
    () =>
      document.querySelector('#contents a[href="#loading"]')?.getAttribute("aria-current") ===
      "location",
  );
  await visit("?component=context-menu");
  const demo = page.locator("#demo");
  const area = demo.locator('[data-glaze="context-menu-trigger"]');
  const rootMenu = page.locator('[data-glaze="context-menu-popup"]').first();
  await area.focus();
  await page.keyboard.press("Shift+F10");
  await demo.getByRole("menuitem", { name: "Add comment" }).waitFor();
  await page.keyboard.press("Escape");
  await rootMenu.waitFor({ state: "hidden" });
  await demo.getByRole("button", { name: "Open actions" }).click();
  await demo.getByRole("menuitem", { name: "Add comment" }).waitFor();
  await page.keyboard.press("Escape");
  await rootMenu.waitFor({ state: "hidden" });
  await demo
    .getByText("Right-click or press Shift+F10", { exact: true })
    .click({ button: "right" });
  const submenu = demo.getByRole("menuitem", { name: "Arrange" });
  await page.waitForFunction(() =>
    document.querySelector('[data-glaze="context-menu-popup"]')?.matches(":popover-open"),
  );
  await submenu.focus();
  await page.keyboard.press("ArrowRight");
  await demo.getByRole("menuitem", { name: "Bring to front" }).waitFor();
  await visit("?component=dialog");
  const opener = demo.getByRole("button", { name: "Rename project" });
  await opener.focus();
  await opener.press("Enter");
  await demo.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await demo.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("data-glaze") === "dialog-trigger",
    undefined,
    { timeout: 3000 },
  );
  // One primary action per popup, and the two scrollbar tiers: thin where a part scrolls, none where
  // the part draws its own. Computed values, since overlay scrollbars never show in a screenshot.
  const look = await page.evaluate(() => {
    const style = (selector) => getComputedStyle(document.querySelector(selector));
    const [cancel, save] = document.querySelectorAll(
      '[data-glaze="dialog-footer"] [data-glaze="dialog-close"]',
    );
    return {
      cancel: getComputedStyle(cancel).backgroundColor,
      save: getComputedStyle(save).backgroundColor,
      popup: style('[data-glaze="dialog-popup"]').scrollbarWidth,
    };
  });
  assert.notEqual(look.save, look.cancel);
  // Playwright's headless Firefox hides every scrollbar itself, so the thin tier can't be read there.
  const harnessHidesScrollbars = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("div"));
    const hidden = getComputedStyle(probe).scrollbarWidth === "none";
    probe.remove();
    return hidden;
  });
  if (!harnessHidesScrollbars) assert.equal(look.popup, "thin");
  await visit("?component=scroll-area");
  assert.equal(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-glaze="scroll-area-viewport"]'))
          .scrollbarWidth,
    ),
    "none",
  );
  await visit("?component=switch");
  const control = demo.getByRole("switch");
  await control.focus();
  const checked = await control.isChecked();
  await page.keyboard.press("Space");
  assert.notEqual(await control.isChecked(), checked);
  const saving = page.locator("#demo-saving");
  const preference = saving.getByRole("switch");
  await saving.getByRole("button", { name: "Drop the network for 3 seconds" }).click();
  await preference.click();
  await saving.getByText("Saving…", { exact: true }).waitFor();
  assert.equal(await preference.isChecked(), true);
  await saving.getByText("Couldn’t save. The server couldn’t be reached.").waitFor();
  assert.equal(await preference.isChecked(), false);
  await visit("?component=tabs");
  await demo.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  assert.equal(
    await page
      .locator("#demo")
      .getByRole("tab", { name: "Activity" })
      .getAttribute("aria-selected"),
    "true",
  );
  await visit("?component=slider");
  const range = demo.getByRole("slider");
  await range.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await range.inputValue(), "41");
  await visit("?component=sortable");
  const handle = demo.getByRole("button", { name: "Move Water the plants", exact: true });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() =>
    document.querySelector('[data-glaze="sortable-item"]')?.textContent?.includes("Book the venue"),
  );
  await demo.getByRole("button", { name: "Move Water the plants up", exact: true }).click();
  assert.match(
    await page.locator('[data-glaze="sortable-item"]').first().innerText(),
    /Water the plants/,
  );
  await visit("?component=pagination");
  await demo.getByRole("link", { name: "Page 7", exact: true }).click();
  await page.reload();
  assert.equal(
    await demo.getByRole("link", { name: "Page 7", exact: true }).getAttribute("aria-current"),
    "page",
  );
  await visit("?component=combobox");
  const fruit = demo.getByRole("combobox", { name: "Fruit" });
  const fruitMenu = page.locator('#demo [data-glaze="combobox-popup"]');
  const trigger = demo.getByRole("button", { name: "Show fruits" });
  await trigger.scrollIntoViewIfNeeded();
  const inputBox = await fruit.boundingBox();
  const triggerBox = await trigger.boundingBox();
  await page.mouse.move(inputBox.x + 8, inputBox.y + inputBox.height / 2);
  await page.mouse.down();
  assert.equal(await fruit.getAttribute("aria-expanded"), "false");
  await page.mouse.up();
  await fruitMenu.waitFor();
  await fruit.press("Escape");
  await fruitMenu.waitFor({ state: "hidden" });

  await trigger.hover();
  await page.mouse.down();
  await fruitMenu.waitFor();
  assert.equal(await fruit.evaluate((el) => el === document.activeElement), true);
  const option = await demo.getByRole("option", { name: "Apple", exact: true }).boundingBox();
  await page.mouse.move(option.x + 10, option.y + option.height / 2);
  await page.mouse.up();
  await fruitMenu.waitFor({ state: "hidden" });
  assert.equal(await fruit.inputValue(), "");

  await trigger.hover();
  await page.mouse.down();
  await fruitMenu.waitFor();
  await page.mouse.up();
  await fruitMenu.locator('[role="option"]').first().waitFor();
  const menuBox = await fruitMenu.boundingBox();
  assert.ok(Math.abs(inputBox.x - menuBox.x) < 1 && Math.abs(inputBox.width - menuBox.width) < 1);
  assert.equal(await fruitMenu.getByRole("status").evaluate((el) => el.offsetHeight), 0);
  await fruit.fill("apri");
  assert.equal(await page.locator('#demo [data-glaze="combobox-clear"]').count(), 0);
  assert.deepEqual(await fruit.boundingBox(), inputBox);
  assert.deepEqual(await trigger.boundingBox(), triggerBox);
  await fruit.press("ArrowDown");
  await fruit.press("Enter");
  assert.equal(await fruit.inputValue(), "Apricot");
  await fruitMenu.waitFor({ state: "hidden" });
  await fruit.fill("no matching fruit");
  await fruitMenu.getByText("No fruit found.").waitFor();
  await fruit.fill("");
  assert.deepEqual(await fruit.boundingBox(), inputBox);
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
  await page.locator('#demo [data-glaze="select-trigger"]').click();
  await demo.getByRole("option", { name: "Dark", exact: true }).click();
  assert.match(await page.locator('#demo [data-glaze="select-trigger"]').innerText(), /Dark/);
  await visit("?component=form");
  await demo.getByRole("textbox", { name: "Email" }).fill("test@example.org");
  await demo.getByRole("textbox", { name: "Username" }).fill("test-studio");
  await demo.getByRole("checkbox").check();
  await demo.getByRole("button", { name: "Create account" }).click();
  await demo.getByText("Account created for test-studio.").waitFor();
  const external = page.locator("#demo-external-errors");
  await external.getByText("This handle is already in use.", { exact: true }).waitFor();
  await external.getByRole("textbox").fill("paper-studio");
  await external.getByRole("button", { name: "Save profile" }).click();
  await external.getByText("Saved @paper-studio").waitFor();
  await external.getByRole("button", { name: "Reset", exact: true }).click();
  assert.equal(await external.getByRole("textbox").inputValue(), "studio");

  await visit("?component=combobox#multiple");
  const labels = page.locator("#demo-multiple");
  await labels.getByRole("button", { name: "Remove Documentation" }).click();
  await labels.getByRole("combobox").fill("feat");
  await labels.getByRole("option", { name: "Feature" }).click();
  await labels.getByRole("button", { name: "Remove Feature" }).waitFor();

  await visit("?component=sortable#board");
  const board = page.locator("#demo-board");
  const moveCard = board.getByRole("button", { name: "Move Draft the brief" });
  await moveCard.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await board.locator('[aria-labelledby="board-doing"]').getByText("Draft the brief").waitFor();

  await visit("?component=file-upload#form");
  const claim = page.locator("#demo-form");
  await claim.locator('input[type="file"]').setInputFiles({
    name: "receipt.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("sample receipt"),
  });
  await claim.getByRole("button", { name: "Submit claim" }).click();
  await claim.getByText("Would send: receipt.pdf").waitFor();

  await visit("?component=button#other-element");
  const custom = page.locator("#demo-other-element");
  const card = custom.getByRole("button", { name: "Add to reading list" });
  await card.press("Space");
  await custom.getByText("Items added: 1").waitFor();
  await custom.getByRole("button", { name: "Lock list" }).click();
  assert.equal(await card.getAttribute("aria-disabled"), "true");
  await card.evaluate((el) => el.click());
  assert.equal(await custom.locator("output").textContent(), "Items added: 1");
  await page.setViewportSize({ width: 320, height: 740 });
  await visit("");
  if (process.env.SCREENSHOTS)
    await page.screenshot({ path: process.env.SCREENSHOTS + "/glaze-mobile.png" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("searchbox").fill("date range");
  assert.equal(await page.locator("#navigation a").count(), 1);
  assert.equal(await page.locator("main").evaluate((el) => el.inert), true);
  await page.locator("#navigation a").focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.closest("main") !== null), false);
  await page.locator("#navigation a").click();
  await page.getByRole("heading", { name: "Date Range Picker", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("searchbox", { includeHidden: true }).inputValue(),
    "date range",
  );
  await visit("?component=button");
  const mobileContents = page.getByRole("navigation", { name: "Component sections" });
  const mobileDemo = page.locator("#demo");
  assert.ok((await mobileContents.boundingBox()).y < (await mobileDemo.boundingBox()).y);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  if (process.env.SCREENSHOTS)
    await page.screenshot({ path: process.env.SCREENSHOTS + "/glaze-component-mobile.png" });
  await mobileContents.getByRole("link", { name: "Sending a request" }).click();
  assert.equal(new URL(page.url()).hash, "#request");
  assert.deepEqual(errors, []);
  console.log(
    `Verified ${found + Object.values(examples).flat().length} live examples across ${found} families, request recovery, theme persistence, keyboard interactions, and section navigation.`,
  );
} finally {
  await browser?.close();
  await server.close();
}

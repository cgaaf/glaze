/** Lines of a file shown before the block offers to expand. */
const PREVIEW_LINES = 12;
const COPIED_MS = 1600;

/** Wire the copy button, the file tabs and the expand control of every code block on the page. */
export function setupCodeBlocks() {
  document.querySelectorAll<HTMLElement>(".code-block").forEach((block) => {
    const copy = block.querySelector<HTMLButtonElement>("[data-copy]")!;
    const status = block.querySelector<HTMLElement>('[role="status"]')!;
    const body = block.querySelector<HTMLElement>(".code-body")!;
    const expand = block.querySelector<HTMLButtonElement>(".code-expand")!;
    const tabs = Array.from(block.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = Array.from(body.querySelectorAll<HTMLElement>("pre"));
    const shown = () => panels.find((panel) => !panel.hidden)!;
    const collapsible = block.classList.contains("source");
    let timer: ReturnType<typeof setTimeout> | undefined;

    /** Offer to expand only a file longer than the preview, and say how long it is. */
    function measure() {
      const lines = shown().textContent!.split("\n").length;
      const long = collapsible && lines > PREVIEW_LINES;
      const open = expand.getAttribute("aria-expanded") === "true";
      block.toggleAttribute("data-collapsed", long && !open);
      expand.hidden = !long;
      expand.firstElementChild!.textContent = open ? "Show less" : `Show all ${lines} lines`;
    }
    /** Change the block's state in `change`, then animate its height from the old one to the new. */
    function resize(change: () => void) {
      const from = body.offsetHeight;
      change();
      measure();
      const to = body.offsetHeight;
      if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // The preview's max-height would clamp the animated height from the first frame of a collapse.
      const frame = (height: number) => ({ height: height + "px", maxHeight: "none" });
      body.animate([frame(from), frame(to)], {
        duration: Math.min(320, 160 + Math.abs(to - from) / 4),
        easing: "cubic-bezier(0.2, 0, 0, 1)",
      });
    }

    copy.onclick = async () => {
      const code = shown().querySelector("code")!;
      try {
        await navigator.clipboard.writeText(code.textContent!);
        status.textContent = "Copied";
        copy.toggleAttribute("data-copied", true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          copy.removeAttribute("data-copied");
          status.textContent = "";
        }, COPIED_MS);
      } catch {
        const range = new Range();
        range.selectNodeContents(code);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        status.textContent = "Source selected. Use your copy command.";
      }
    };
    expand.onclick = () => {
      const open = expand.getAttribute("aria-expanded") !== "true";
      resize(() => expand.setAttribute("aria-expanded", String(open)));
      // Collapsing a long file from its end would leave the reader far below the block.
      if (!open) block.scrollIntoView({ block: "nearest" });
    };
    function select(index: number) {
      resize(() => {
        tabs.forEach((tab, at) => {
          tab.setAttribute("aria-selected", String(at === index));
          tab.tabIndex = at === index ? 0 : -1;
          panels[at].hidden = at !== index;
        });
        copy.setAttribute("aria-label", "Copy " + panels[index].dataset.label);
      });
    }
    tabs.forEach((tab, index) => {
      tab.onclick = () => select(index);
      tab.onkeydown = (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        const next = (index + step + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      };
    });
    measure();
  });
}

// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import widgetSource from "../../../islands/CurrentlyWidget.svelte?raw";
import currentlyCardSource from "../../../islands/lib/CurrentlyCard.svelte?raw";
import cyberdeckSource from "../../../islands/lib/CyberdeckLayout.svelte?raw";
import typesSource from "../../../islands/lib/currently-types.ts?raw";
import desktopSource from "../../../islands/lib/DesktopLayout.svelte?raw";
import nowPlayingSource from "../../../islands/lib/NowPlayingCard.svelte?raw";
import nunotchiCardSource from "../../../islands/lib/NunotchiCard.svelte?raw";
import readingCardSource from "../../../islands/lib/ReadingCard.svelte?raw";
import terminalCardSource from "../../../islands/lib/TerminalCard.svelte?raw";
import windowStateSource from "../../../islands/lib/window-state.svelte.ts?raw";
import indexSource from "../../../pages/index.astro?raw";

// CSS `?raw` imports return empty under vitest's plugin chain — read from disk.
const widgetCssSource = readFileSync(
  fileURLToPath(new URL("../../../styles/currently-widget.css", import.meta.url)),
  "utf-8",
);

// Aggregated source covers everything the widget contributes — widget itself,
// layouts, cards, helpers, and the extracted stylesheet. Tests assert behavior
// is preserved wherever Deep-Modules extraction parked each concern.
const allSource = [
  widgetSource,
  desktopSource,
  cyberdeckSource,
  nowPlayingSource,
  nunotchiCardSource,
  currentlyCardSource,
  readingCardSource,
  terminalCardSource,
  typesSource,
  windowStateSource,
  widgetCssSource,
].join("\n");

const CJK_RANGE = /[\u{4E00}-\u{9FFF}\u{3040}-\u{309F}\u{30A0}-\u{30FF}\u{FF00}-\u{FFEF}]/u;

describe("CurrentlyWidget island contract (Story 1.20)", () => {
  it("exports five window types — currently, nowplaying, reading, nunotchi, terminal", () => {
    expect(typesSource).toContain(
      'export type WinId = "currently" | "nowplaying" | "reading" | "nunotchi" | "terminal"',
    );
    expect(windowStateSource).toContain("currently: {");
    expect(windowStateSource).toContain("nowplaying: {");
    expect(windowStateSource).toContain("reading: {");
    expect(windowStateSource).toContain("nunotchi: {");
    expect(windowStateSource).toContain("terminal: {");
  });

  it("each window has System-1 chrome — 1.5px border + 3px drop", () => {
    expect(widgetCssSource).toContain("1.5px solid");
    expect(widgetCssSource).toContain("3px 3px 0");
  });

  it("close button redirects focus to matching desktop icon", () => {
    expect(windowStateSource).toContain("ICON_LABELS");
    expect(windowStateSource).toContain('nunotchi: "Nunotchi"');
    expect(windowStateSource).toContain('reading: "Reading.txt"');
    expect(windowStateSource).toContain('nowplaying: "Music"');
    expect(windowStateSource).toContain('terminal: "Terminal"');
    expect(windowStateSource).toContain("function closeWin");
  });

  it("terminal dispatches via lookupCommand", () => {
    expect(widgetSource).toContain("import { lookupCommand");
    expect(widgetSource).toContain("function ask(e: Event)");
    expect(widgetSource).toContain("lookupCommand(q,");
  });

  it("audio-host is hidden and aria-hidden", () => {
    expect(nowPlayingSource).toContain('class="audio-host"');
    expect(nowPlayingSource).toContain('aria-hidden="true"');
  });

  it("prefers-reduced-motion disables animations", () => {
    expect(widgetSource).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
    expect(widgetSource).toContain("queueMicrotask(finish)");
  });

  it("nightfall mode uses CSS custom properties", () => {
    expect(widgetCssSource).toContain('html[data-theme="nightfall"] .widget-frame');
    expect(widgetCssSource).toContain("--ink:");
    expect(widgetCssSource).toContain("--paper:");
  });

  it("pointer coarse detection guards drag handlers", () => {
    expect(widgetSource).toContain('window.matchMedia("(pointer: coarse)")');
    expect(allSource).toContain("coarsePointer");
    expect(windowStateSource).toContain("e.button !== 0 || opts.coarsePointer()");
  });

  it("menu bar reads File Edit View without Special", () => {
    expect(desktopSource).toContain("★ File · Edit · View");
    expect(allSource).not.toContain("Special ·");
  });

  it("clock updates once per minute not per second", () => {
    expect(widgetSource).toContain("setInterval(updateClock, 60_000)");
  });

  it("no kanji in rendered strings", () => {
    expect(allSource.match(CJK_RANGE)).toBeNull();
  });

  it("index.astro hydrates client:visible, no client:load in pages", () => {
    expect(indexSource).toContain("client:visible");
    expect(indexSource).not.toContain("client:load");
  });

  it("compact mode gates reading window to 3 windows", () => {
    expect(desktopSource).toContain("wins.reading.open && !compact");
    expect(desktopSource).toContain("{#if !compact}");
  });

  it("cyberdeck markup exists for mobile/coarse pointer", () => {
    expect(widgetCssSource).toContain(".cyberdeck");
    expect(widgetCssSource).toContain(".cyberdeck-stack");
    expect(widgetCssSource).toContain(".cyberdeck-card");
    expect(widgetCssSource).toContain(".cyberdeck-brand");
    expect(cyberdeckSource).toContain('class="cyberdeck"');
  });

  it("reduced-motion disables marquee animation", () => {
    // Match across line breaks — biome formats the extracted stylesheet
    // multi-line, so the rule body sits below the selector instead of inline.
    expect(widgetCssSource).toMatch(
      /\.widget-frame \.np-track-scroll\s*{\s*animation:\s*none;\s*}/,
    );
  });

  it("clock placeholder is empty string not em-dash colon", () => {
    expect(widgetSource).toContain('let clock = $state("");');
    expect(desktopSource).toContain('{clock || "—"}');
    expect(widgetSource).not.toContain('let clock = $state("—:—")');
  });

  it("repositionWindows function removed", () => {
    expect(allSource).not.toContain("function repositionWindows");
  });

  it("compact surface uses min-height not height", () => {
    expect(widgetCssSource).toContain("min-height: clamp");
  });

  it("AC8 frame chrome treatment A (deckle) is applied to the compact frame", () => {
    expect(widgetCssSource).toContain('.widget-frame[data-compact="true"]');
    expect(widgetCssSource).toContain("box-shadow: 4px 4px 0 var(--ink)");
    expect(widgetCssSource).toContain("max-inline-size: min(760px, 100%)");
  });

  it("AC11 cyberdeck has a labeled region and per-card group roles (G-AMENDED)", () => {
    expect(cyberdeckSource).toContain('class="cyberdeck" role="region" aria-label="Cyberdeck"');
    expect(cyberdeckSource).toContain('role="group" aria-label="System"');
    expect(cyberdeckSource).toContain('role="group" aria-label="Now Playing"');
    expect(cyberdeckSource).toContain('role="group" aria-label="Nunotchi"');
    expect(cyberdeckSource).toContain('role="group" aria-label="Terminal"');
  });

  it("AC15 interaction wiring is regression-locked (drag, NP controls, Nunotchi)", () => {
    expect(desktopSource).toContain("onpointerdown={(e) => winState.startDrag(e,");
    expect(nowPlayingSource).toContain("onclick={onTogglePlay}");
    expect(nunotchiCardSource).toContain("onclick={onFeed}");
    expect(nunotchiCardSource).toContain("onclick={onPlay}");
    expect(nunotchiCardSource).toContain("onclick={onWalk}");
    expect(nunotchiCardSource).toContain("onclick={onNap}");
  });

  it("cyberdeck honors nunotchi minimized state — pet loop pauses on mobile", () => {
    expect(widgetSource).toContain(
      "winState.wins.nunotchi.open && !winState.wins.nunotchi.minimized",
    );
    expect(cyberdeckSource).toContain("{#if !wins.nunotchi.minimized}");
    expect(cyberdeckSource).toContain('aria-label={wins.nunotchi.minimized ? "Expand Nunotchi"');
  });

  it("cyberdeck stack does not trap touch scroll (no max-height/overflow-y)", () => {
    expect(widgetCssSource).not.toMatch(/\.cyberdeck-stack\s*{[^}]*overflow-y:\s*auto/);
    expect(widgetCssSource).not.toMatch(/\.cyberdeck-stack\s*{[^}]*max-height:\s*70vh/);
    expect(widgetCssSource).toContain("touch-action: auto");
  });

  it("reading.page is guarded when the schema field is absent", () => {
    expect(currentlyCardSource).toContain("{#if data.reading.page} · p.{data.reading.page}{/if}");
    expect(allSource).not.toContain(" · p.{data.reading.page}</dd>");
  });
});

// @vitest-environment node
import widgetSource from "../../../islands/CurrentlyWidget.svelte?raw";
import indexSource from "../../../pages/index.astro?raw";

const CJK_RANGE = /[\u{4E00}-\u{9FFF}\u{3040}-\u{309F}\u{30A0}-\u{30FF}\u{FF00}-\u{FFEF}]/u;

describe("CurrentlyWidget island contract (Story 1.20)", () => {
  it("exports five window types — currently, nowplaying, reading, nunotchi, terminal", () => {
    expect(widgetSource).toContain(
      'type WinId = "currently" | "nowplaying" | "reading" | "nunotchi" | "terminal"',
    );
    expect(widgetSource).toContain("currently: {");
    expect(widgetSource).toContain("nowplaying: {");
    expect(widgetSource).toContain("reading: {");
    expect(widgetSource).toContain("nunotchi: {");
    expect(widgetSource).toContain("terminal: {");
  });

  it("each window has System-1 chrome — 1.5px border + 3px drop", () => {
    expect(widgetSource).toContain("1.5px solid");
    expect(widgetSource).toContain("3px 3px 0");
  });

  it("close button redirects focus to matching desktop icon", () => {
    expect(widgetSource).toContain("const iconMap: Record<string, string>");
    expect(widgetSource).toContain('nunotchi: "Nunotchi"');
    expect(widgetSource).toContain('reading: "Reading.txt"');
    expect(widgetSource).toContain('nowplaying: "Music"');
    expect(widgetSource).toContain('terminal: "Terminal"');
    expect(widgetSource).toContain("function closeWin(id: WinId)");
  });

  it("terminal dispatches via lookupCommand", () => {
    expect(widgetSource).toContain("import { lookupCommand");
    expect(widgetSource).toContain("function ask(e: Event)");
    expect(widgetSource).toContain("lookupCommand(q,");
  });

  it("audio-host is hidden and aria-hidden", () => {
    expect(widgetSource).toContain('class="audio-host"');
    expect(widgetSource).toContain('aria-hidden="true"');
  });

  it("prefers-reduced-motion disables animations", () => {
    expect(widgetSource).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
    expect(widgetSource).toContain("queueMicrotask(finish)");
  });

  it("nightfall mode uses CSS custom properties", () => {
    expect(widgetSource).toContain(':global(html[data-theme="nightfall"]) .widget-frame');
    expect(widgetSource).toContain("--ink:");
    expect(widgetSource).toContain("--paper:");
  });

  it("pointer coarse detection guards drag handlers", () => {
    expect(widgetSource).toContain('window.matchMedia("(pointer: coarse)")');
    expect(widgetSource).toContain("coarsePointer");
    expect(widgetSource).toContain("if (e.button !== 0 || coarsePointer) return;");
  });

  it("menu bar reads File Edit View without Special", () => {
    expect(widgetSource).toContain("★ File · Edit · View");
    expect(widgetSource).not.toContain("Special ·");
  });

  it("clock updates once per minute not per second", () => {
    expect(widgetSource).toContain("setInterval(updateClock, 60_000)");
  });

  it("no kanji in rendered strings", () => {
    // Scan string literals in the source for CJK glyphs.
    const matches = widgetSource.match(CJK_RANGE);
    expect(matches).toBeNull();
  });

  it("index.astro hydrates client:visible, no client:load in pages", () => {
    expect(indexSource).toContain("client:visible");
    // After AC4 (delete /currently/), no page should use client:load.
    expect(indexSource).not.toContain("client:load");
  });
  it("compact mode gates reading window to 3 windows", () => {
    expect(widgetSource).toContain("wins.reading.open && !compact");
    expect(widgetSource).toContain("{#if !compact}");
  });

  it("cyberdeck markup exists for mobile/coarse pointer", () => {
    expect(widgetSource).toContain(".cyberdeck");
    expect(widgetSource).toContain(".cyberdeck-stack");
    expect(widgetSource).toContain(".cyberdeck-card");
    expect(widgetSource).toContain(".cyberdeck-brand");
  });

  it("reduced-motion disables marquee animation", () => {
    expect(widgetSource).toContain(".np-track-scroll { animation: none; }");
  });

  it("clock placeholder is empty string not em-dash colon", () => {
    expect(widgetSource).toContain('let clock = $state("");');
    expect(widgetSource).toContain('{clock || "—"}');
    expect(widgetSource).not.toContain('let clock = $state("—:—")');
  });

  it("repositionWindows function removed", () => {
    expect(widgetSource).not.toContain("function repositionWindows");
  });

  it("compact surface uses min-height not height", () => {
    expect(widgetSource).toContain("min-height: clamp");
  });

  it("TabId type added for cyberdeck tabs", () => {
    expect(widgetSource).toContain(
      'type TabId = "currently" | "nowplaying" | "nunotchi" | "terminal"',
    );
  });
});

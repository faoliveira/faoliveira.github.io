// src/modules/theme/__tests__/theme.test.ts
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getTheme, THEME_KEY, toggleTheme } from "../index";
import { getThemeScript } from "../theme-script";

// jsdom 29 dropped built-in localStorage — provide a minimal stub
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => {
    localStorageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageStore[key];
  },
  clear: () => {
    for (const k in localStorageStore) delete localStorageStore[k];
  },
};

beforeAll(() => {
  vi.stubGlobal("localStorage", localStorageMock);
});

describe("theme module", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTheme()", () => {
    it('returns "day" by default when no data-theme attribute', () => {
      expect(getTheme()).toBe("day");
    });

    it('returns "nightfall" when data-theme is "nightfall"', () => {
      document.documentElement.dataset.theme = "nightfall";
      expect(getTheme()).toBe("nightfall");
    });

    it('returns "day" when data-theme is "day"', () => {
      document.documentElement.dataset.theme = "day";
      expect(getTheme()).toBe("day");
    });

    it('returns "day" for unknown data-theme values', () => {
      document.documentElement.dataset.theme = "unknown";
      expect(getTheme()).toBe("day");
    });
  });

  describe("toggleTheme()", () => {
    it('switches from "day" to "nightfall"', () => {
      document.documentElement.dataset.theme = "day";
      const next = toggleTheme();
      expect(next).toBe("nightfall");
      expect(document.documentElement.dataset.theme).toBe("nightfall");
    });

    it('switches from "nightfall" to "day"', () => {
      document.documentElement.dataset.theme = "nightfall";
      const next = toggleTheme();
      expect(next).toBe("day");
      expect(document.documentElement.dataset.theme).toBe("day");
    });

    it('defaults to "day" when no theme is set, then toggles to "nightfall"', () => {
      const next = toggleTheme();
      expect(next).toBe("nightfall");
    });

    it("saves the new theme to localStorage", () => {
      document.documentElement.dataset.theme = "day";
      toggleTheme();
      expect(localStorage.getItem(THEME_KEY)).toBe("nightfall");
    });

    it("persists across multiple toggles", () => {
      document.documentElement.dataset.theme = "day";
      toggleTheme(); // → nightfall
      toggleTheme(); // → day
      expect(localStorage.getItem(THEME_KEY)).toBe("day");
      expect(document.documentElement.dataset.theme).toBe("day");
    });

    it("updates color-scheme meta tag when toggling to nightfall", () => {
      const meta = document.createElement("meta");
      meta.name = "color-scheme";
      meta.content = "light";
      document.head.appendChild(meta);

      document.documentElement.dataset.theme = "day";
      toggleTheme();
      expect(meta.content).toBe("dark");

      document.head.removeChild(meta);
    });

    it("updates color-scheme meta tag when toggling to day", () => {
      const meta = document.createElement("meta");
      meta.name = "color-scheme";
      meta.content = "dark";
      document.head.appendChild(meta);

      document.documentElement.dataset.theme = "nightfall";
      toggleTheme();
      expect(meta.content).toBe("light");

      document.head.removeChild(meta);
    });
  });

  describe("localStorage integration", () => {
    it('THEME_KEY is "koubou-theme"', () => {
      expect(THEME_KEY).toBe("koubou-theme");
    });

    it("writes to localStorage with correct key on toggle", () => {
      document.documentElement.dataset.theme = "day";
      toggleTheme();
      expect(localStorage.getItem("koubou-theme")).toBe("nightfall");
    });
  });

  describe("getThemeScript() — inline script execution", () => {
    function runScript() {
      // biome-ignore lint/security/noGlobalEval: evaluating the actual inline theme script in jsdom to test real behavior
      eval(getThemeScript());
    }

    it("sets data-theme to 'nightfall' when saved preference is 'nightfall'", () => {
      localStorageStore[THEME_KEY] = "nightfall";
      runScript();
      expect(document.documentElement.dataset.theme).toBe("nightfall");
    });

    it("sets data-theme to 'day' when saved preference is 'day'", () => {
      localStorageStore[THEME_KEY] = "day";
      runScript();
      expect(document.documentElement.dataset.theme).toBe("day");
    });

    it("sets data-theme to 'nightfall' based on system dark preference when no saved pref", () => {
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
      runScript();
      expect(document.documentElement.dataset.theme).toBe("nightfall");
    });

    it("sets data-theme to 'day' based on system light preference when no saved pref", () => {
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
      runScript();
      expect(document.documentElement.dataset.theme).toBe("day");
    });

    it("saved preference overrides system dark preference", () => {
      localStorageStore[THEME_KEY] = "day";
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
      runScript();
      expect(document.documentElement.dataset.theme).toBe("day");
    });

    it("defaults to 'day' when no saved pref and matchMedia unavailable", () => {
      vi.stubGlobal("matchMedia", undefined);
      runScript();
      expect(document.documentElement.dataset.theme).toBe("day");
    });

    it("ignores invalid saved values and falls back to system preference", () => {
      localStorageStore[THEME_KEY] = "invalid-value";
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
      runScript();
      expect(document.documentElement.dataset.theme).toBe("day");
    });

    it("re-applies saved theme on astro:after-swap (View Transitions navigation)", () => {
      localStorageStore[THEME_KEY] = "nightfall";
      runScript();
      // Simulate View Transitions swap resetting data-theme
      document.documentElement.dataset.theme = "day";
      document.dispatchEvent(new Event("astro:after-swap"));
      expect(document.documentElement.dataset.theme).toBe("nightfall");
    });

    it("does not crash when localStorage throws (private browsing)", () => {
      const throwingStorage = {
        getItem: () => {
          throw new DOMException("SecurityError");
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      };
      vi.stubGlobal("localStorage", throwingStorage);
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
      expect(() => runScript()).not.toThrow();
      expect(document.documentElement.dataset.theme).toBe("day");
    });
  });
});

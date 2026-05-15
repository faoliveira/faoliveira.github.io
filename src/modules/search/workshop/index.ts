import { SEARCH_CONFIG } from "../index";
import { loadPagefind } from "./pagefind-client";
import { itemsHtml, noResultsHtml, resultsLabel, unavailableHtml } from "./render";
import { hasSubstantialMatch } from "./sanitize";
import {
  createNunoController,
  createResultsController,
  type NunoController,
  type ResultsController,
} from "./ui-state";

export interface WorkshopSearchElements {
  input: HTMLInputElement | null;
  results: HTMLElement | null;
  status: HTMLElement | null;
  clearBtn: HTMLButtonElement | null;
  hint: HTMLElement | null;
  suggestions: HTMLElement | null;
  nunoCard: HTMLElement | null;
}

const MIN_QUERY_LENGTH = 2;

export function initWorkshopSearch(els: WorkshopSearchElements): () => void {
  if (!els.input || !els.results || !els.status)
    return () => {
      /* no-op */
    };
  const input: HTMLInputElement = els.input;
  const results: HTMLElement = els.results;
  const status: HTMLElement = els.status;
  const { clearBtn, hint, suggestions, nunoCard } = els;

  const nuno = createNunoController(nunoCard);
  const view = createResultsController(results);

  const setHint = (text: string) => {
    if (hint) hint.textContent = text;
  };
  const showSuggestions = () => suggestions?.removeAttribute("hidden");
  const hideSuggestions = () => suggestions?.setAttribute("hidden", "");

  const reset = () => {
    view.hide();
    status.textContent = "";
    nuno.hide();
    setHint("press / to focus");
    showSuggestions();
  };

  const renderUnavailable = () => {
    view.showHtml(unavailableHtml());
    nuno.hide();
  };

  const renderNoResults = (query: string) => {
    view.showHtml(noResultsHtml(query));
    status.textContent = `No results for ${query}`;
    nuno.show();
  };

  async function runSearch(term: string) {
    const trimmed = term.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      reset();
      return;
    }

    hideSuggestions();
    setHint("looking…");

    const pf = await loadPagefind();
    if (!pf) {
      renderUnavailable();
      setHint("index not ready");
      return;
    }

    const search = await pf.debouncedSearch(trimmed, {}, SEARCH_CONFIG.debounceMs);
    if (search === null) return;

    if (search.results.length === 0) {
      renderNoResults(trimmed);
      setHint("try fewer words");
      return;
    }

    const items = await Promise.all(
      search.results.slice(0, SEARCH_CONFIG.maxResults).map((r) => r.data()),
    );
    const substantial = items.filter((item) => hasSubstantialMatch(item.excerpt, trimmed));
    if (substantial.length === 0) {
      renderNoResults(trimmed);
      setHint("try fewer words");
      return;
    }

    view.showHtml(itemsHtml(substantial));
    status.textContent = resultsLabel(substantial.length, trimmed);
    nuno.hide();
    setHint("↵ open first result");
  }

  const onInput = () => runSearch(input.value);
  const onClear = () => {
    input.value = "";
    reset();
    input.focus();
  };
  const onInputKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      input.value = "";
      reset();
      input.focus();
    }
  };
  const onSuggestionClick = (e: Event) => {
    const btn = e.currentTarget as HTMLElement;
    const suggestion = btn.dataset.suggestion ?? "";
    input.value = suggestion;
    runSearch(suggestion);
    input.focus();
  };

  // Global slash shortcut — capture phase to beat browser quick-find
  const slashHandler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isTyping =
      !!target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    if (
      (e.key === "/" || e.code === "Slash") &&
      !isTyping &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      e.stopPropagation();
      input.focus();
    }
  };

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onInputKeydown);
  clearBtn?.addEventListener("click", onClear);
  const chips = Array.from(document.querySelectorAll<HTMLElement>(".suggestion-chip"));
  for (const btn of chips) {
    btn.addEventListener("click", onSuggestionClick);
  }
  window.addEventListener("keydown", slashHandler, true);

  return () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onInputKeydown);
    clearBtn?.removeEventListener("click", onClear);
    for (const btn of chips) {
      btn.removeEventListener("click", onSuggestionClick);
    }
    window.removeEventListener("keydown", slashHandler, true);
  };
}

export type { NunoController, ResultsController };

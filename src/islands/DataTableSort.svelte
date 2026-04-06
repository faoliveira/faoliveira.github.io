<script lang="ts">
// DataTableSort.svelte — Svelte 5 island for sortable table headers
// Finds the target table by ID in the DOM and adds click-to-sort handlers
interface Props {
  tableId: string;
}

let { tableId }: Props = $props();

let sortCol = $state(-1);
let sortDir = $state<"asc" | "desc">("asc");

$effect(() => {
  const table = document.getElementById(tableId);
  if (!table) return;

  const headers = Array.from(table.querySelectorAll("thead th"));
  const cleanups: Array<() => void> = [];

  headers.forEach((th, i) => {
    const el = th as HTMLElement;
    el.style.cursor = "pointer";
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-sort", "none"); // initial state for screen readers

    const handleSort = () => sortByColumn(table as HTMLTableElement, i);
    const handleKeydown = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === "Enter" || ke.key === " ") {
        ke.preventDefault();
        handleSort();
      }
    };

    el.addEventListener("click", handleSort);
    el.addEventListener("keydown", handleKeydown);

    cleanups.push(() => {
      el.removeEventListener("click", handleSort);
      el.removeEventListener("keydown", handleKeydown);
      el.removeAttribute("aria-sort");
      el.removeAttribute("tabindex");
      el.style.cursor = "";
    });
  });

  return () => {
    cleanups.forEach((fn) => {
      fn();
    });
  };
});

function tryNumeric(text: string): number | null {
  const cleaned = text.replace(/,/g, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === "—") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

function sortByColumn(table: HTMLTableElement, colIndex: number) {
  const newDir: "asc" | "desc" = sortCol === colIndex && sortDir === "asc" ? "desc" : "asc";
  sortCol = colIndex;
  sortDir = newDir;

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));
  rows.sort((a, b) => {
    const aText = (a.querySelectorAll("td")[colIndex]?.textContent ?? "").trim();
    const bText = (b.querySelectorAll("td")[colIndex]?.textContent ?? "").trim();
    const aNum = tryNumeric(aText);
    const bNum = tryNumeric(bText);
    const isNumeric = aNum !== null && bNum !== null;
    const cmp = isNumeric ? aNum - bNum : aText.localeCompare(bText);
    return newDir === "asc" ? cmp : -cmp;
  });

  rows.forEach((row) => {
    tbody.appendChild(row);
  });

  // Update ARIA sort indicators
  const headers = table.querySelectorAll("thead th");
  headers.forEach((th, i) => {
    if (i === colIndex) {
      th.setAttribute("aria-sort", newDir === "asc" ? "ascending" : "descending");
    } else {
      th.setAttribute("aria-sort", "none");
    }
  });
}
</script>

<!-- This island renders no visible UI — it only enhances the existing table DOM -->

// Only article headings marked by the docs renderer belong in the page navigation.
export function pageSections() {
  return Array.from(document.querySelectorAll("#main [data-page-section]"), (heading) => ({
    id: heading.id,
    title: heading.textContent.trim(),
  }));
}

export function headingOffset() {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
}

export function currentPage() {
  const page = Number(new URL(location.href).searchParams.get("p"));
  return Number.isSafeInteger(page) && page > 0 ? page : 6;
}

export function pageHref(page) {
  const url = new URL(location.href);
  url.searchParams.set("p", String(page));
  return url.href;
}

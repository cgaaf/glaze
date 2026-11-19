// Stands in for a server in the "sorting and paging on a server" table demo: it holds 23 orders, sorts and
// slices them as asked, and takes 700ms to answer.
const CUSTOMERS = [
  "Larkspur Supply",
  "Quill & Co",
  "Northgate Café",
  "Fennel Kitchen",
  "Harbor Print",
  "Juniper Hotel",
];
const ORDERS = Array.from({ length: 23 }, (_, index) => ({
  id: `K-${2001 + index}`,
  customer: CUSTOMERS[(index * 5) % CUSTOMERS.length],
  total: Math.round((48 + ((index * 137) % 890)) * 100) / 100,
}));

/**
 * One page of orders. `sort` is a column id, with a leading "-" for descending, or "" for the server's own
 * order.
 */
export function loadOrders(sort, pageIndex, pageSize) {
  const key = sort.replace(/^-/, "");
  const direction = sort.startsWith("-") ? -1 : 1;
  const sorted = key
    ? ORDERS.toSorted((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * direction)
    : ORDERS;
  const rows = sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  return new Promise((resolve) => {
    setTimeout(() => resolve({ rows, total: ORDERS.length }), 700);
  });
}

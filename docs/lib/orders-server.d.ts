export declare function loadOrders(
  sort: string,
  pageIndex: number,
  pageSize: number,
): Promise<{ rows: { id: string; customer: string; total: number }[]; total: number }>;

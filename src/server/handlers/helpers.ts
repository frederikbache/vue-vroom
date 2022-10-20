import ServerError from '../../ServerError';

export function paginateItems(items: any[], page: number, limit: number) {
  return {
    paginatedItems: items.slice((page - 1) * limit, page * limit),
    paginationMeta: {
      page,
      results: items.length,
      pages: Math.ceil(items.length / limit),
    },
  };
}

export function cursorPaginate(
  items: any[],
  cursor: string | number,
  limit: number
) {
  let index = 0;
  if (cursor) {
    index = items.findIndex((item) => item.id == cursor);
    if (index === -1) throw new ServerError(404, { type: 'cursor_not_found' });
  }

  let paginatedItems = items.slice(index, index + limit + 1);
  let nextCursor = null;
  if (paginatedItems.length > limit) {
    nextCursor = paginatedItems.pop().id;
  }
  return {
    paginatedItems,
    paginationMeta: { nextCursor },
  };
}

export function sortItems(items: any[], sortStr: string) {
  if (!sortStr) return items;
  const sort = sortStr.split(',');
  return [...items].sort((a, b) => {
    for (let i = 0; i < sort.length; i += 1) {
      const field = sort[i].replace(/^-/, '');
      const dir = sort[i].charAt(0) === '-' ? -1 : 1;
      const aVal = a[field];
      const bVal = b[field];
      let comp = 0;
      if (typeof aVal === 'string') {
        comp = aVal.localeCompare(bVal) * dir;
      } else {
        comp = (aVal - bVal) * dir;
      }
      if (comp !== 0) return comp;
    }
    return 0;
  });
}

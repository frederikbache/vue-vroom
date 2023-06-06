import ServerError from '../../ServerError';

function matchType(a: string | number | boolean, b: string) {
  if (typeof a === 'boolean') return b === 'true';
  return typeof a === 'number' ? parseFloat(b) : b;
}

const FILTER_FUNCTIONS = {
  lt: (a: any, b: any) =>
    typeof a === 'string' ? a.localeCompare(b) < 0 : a < matchType(a, b),
  lte: (a: any, b: any) =>
    typeof a === 'string' ? a.localeCompare(b) <= 0 : a <= matchType(a, b),
  gt: (a: any, b: any) =>
    typeof a === 'string' ? a.localeCompare(b) > 0 : a > matchType(a, b),
  gte: (a: any, b: any) =>
    typeof a === 'string' ? a.localeCompare(b) >= 0 : a >= matchType(a, b),
  between: (a: any, b: string) => {
    const c = b.split(',');
    if (typeof a === 'string') {
      return a.localeCompare(c[0]) > 0 && a.localeCompare(c[1]) < 0;
    }
    return a > matchType(a, c[0]) && a < matchType(a, c[1]);
  },
  contains: (a: string, b: string) => a.indexOf(b) !== -1,
};

export function parseFilterField(field: string) {
  const match = field.match(/(.*)\[(.*)\]/);
  if (!match) {
    return { name: field, fn: (a: any, b: any) => a === matchType(a, b) };
  }
  const [, name, op] = match;

  return {
    name,
    // @ts-expect-error
    fn: FILTER_FUNCTIONS[op],
  };
}

export function paginateItems(items: any[], page: number, limit: number) {
  return {
    paginatedItems:
      limit === -1 ? items : items.slice((page - 1) * limit, page * limit),
    paginationMeta: {
      page,
      results: items.length,
      pages: limit === -1 ? 1 : Math.ceil(items.length / limit),
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

export function sortItems(
  items: any[],
  sortStr: string,
  sorters: any,
  db: any
) {
  if (!sortStr) return items;
  const sort = sortStr.split(',');
  return [...items].sort((a, b) => {
    for (let i = 0; i < sort.length; i += 1) {
      const field = sort[i].replace(/^-/, '');
      const dir = sort[i].charAt(0) === '-' ? -1 : 1;
      let comp = 0;
      if (sorters && sorters[field]) {
        comp = sorters[field](a, b, dir, db);
      } else {
        const aVal = a[field];
        const bVal = b[field];
        if (typeof aVal === 'string') {
          comp = aVal.localeCompare(bVal) * dir;
        } else {
          comp = (aVal - bVal) * dir;
        }
      }

      if (comp !== 0) return comp;
    }
    return 0;
  });
}

import helper from '../../helper';
import type { Request } from '../Server';
import Server from '../Server';
import { cursorPaginate, paginateItems, sortItems } from './helpers';
import { parseFilterField } from './helpers';

type ListQuery = {
  page: number;
  limit: number;
  sort: string;
  cursor: number | string;
  include: string;
};

export default function indexHandler(
  request: Request,
  db: any,
  server: Server<any, any>
) {
  const { page, limit, cursor, sort, include, ...filters } =
    request.query as ListQuery;

  let items = db[request.model].all().filter((item: any) => {
    let match = true;
    Object.entries(filters).forEach(([field, value]) => {
      if (request.filters && field in request.filters) {
        if (!request.filters[field](item, value as string, db)) match = false;
      } else {
        const { name, fn } = parseFilterField(field);
        if (name in item && !fn(item[name], value)) match = false;
      }
    });
    return match;
  });

  items = sortItems(items, sort, request.sorters, db);

  const hasMany = db[request.model].hasMany;
  const includeList = include ? include.split(',') : [];
  items = items.map((item: any) => {
    Object.keys(item).forEach((field) => {
      const rel = helper.removeHasManyPostfix(field);
      if (rel in hasMany && !includeList.includes(rel)) {
        delete item[field];
      }
    });
    return item;
  });

  if (request.settings.envelope === false) {
    return items;
  }

  let meta = {} as any;

  if (request.settings.listMeta) {
    Object.entries(request.settings.listMeta).forEach(([key, field]) => {
      if (request.metaFieldMethods && request.metaFieldMethods[key]) {
        meta[key] = request.metaFieldMethods[key](items, db);
      } else {
        meta[key] = field.type();
      }
    });
  }

  const paginationSettings = request.settings.pagination;
  if (paginationSettings) {
    if (paginationSettings.type === 'page') {
      const { paginatedItems, paginationMeta } = paginateItems(
        items,
        page || 1,
        limit || paginationSettings.defaultLimit
      );
      items = paginatedItems;
      meta = { ...meta, ...paginationMeta };
    }

    if (paginationSettings.type === 'cursor') {
      const { paginatedItems, paginationMeta } = cursorPaginate(
        items,
        cursor,
        limit || paginationSettings.defaultLimit
      );
      items = paginatedItems;
      meta = { ...meta, ...paginationMeta };
    }
  }

  const included = {} as { [key: string]: any[] };
  includeList.forEach((field: string) => {
    const modelName = db[request.model].getRelatedModelName(field);
    if (!included[modelName]) {
      included[modelName] = [];
    }
    items.forEach((item: any) => {
      const rels = db[request.model].getRelated(item.id, field);
      rels.forEach((rel: any) => {
        if (!included[modelName].find((r) => r.id === rel.id))
          included[modelName].push(rel);
      });
    });

    // Remove *Ids fields on the relations
    const relatedHasMany = db[modelName].hasMany;
    included[modelName] = included[modelName].map((item: any) => {
      Object.keys(item).forEach((field) => {
        const rel = helper.removeHasManyPostfix(field);
        if (rel in relatedHasMany) {
          delete item[field];
        }
      });
      return item;
    });
  });

  if (request.sideEffects?.index) {
    const result = request.sideEffects.index(items, db, request);
    if (result) {
      items = result;
    }
  }

  return {
    [server.naming.data]: items,
    [server.naming.meta]: meta,
    [server.naming.included]: included,
  };
}

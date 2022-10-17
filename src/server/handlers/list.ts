import type { Request } from '../Server'
import { cursorPaginate, paginateItems, sortItems } from './helpers'

type ListQuery = {
    page: number,
    limit: number,
    sort: string,
    cursor: number | string,
    include: string
}

function matchType(a: string | number | boolean, b: string) {
    if (typeof a === 'boolean') return b === 'true';
    return typeof a === 'number' ? parseFloat(b) : b;
}

const FILTER_FUNCTIONS = {
    lt: (a: any, b: any) => a < matchType(a, b),
    lte: (a: any, b: any) => a <= matchType(a, b),
    gt: (a: any, b: any) => a > matchType(a, b),
    gte: (a: any, b: any) => a >= matchType(a, b),
    between: (a: any, b: string) => {
        const c = b.split(',')
        return a > matchType(a, c[0]) && a < matchType(a, c[1])
    },
    contains: (a: string, b: string) => a.indexOf(b) !== -1
}

function parseFilterField(field: string) {
    const match = field.match(/(.*)\[(.*)\]/)
    if (!match) {
        return { name: field, fn: (a: any, b: any) => a === matchType(a, b) }
    }
    const [, name, op] = match;

    return {
        name,
        // @ts-expect-error
        fn: FILTER_FUNCTIONS[op]
    }
}

export default function indexHandler(request: Request, db: any) {
    const { page, limit, cursor, sort, include, ...filters } = request.query as ListQuery;

    let items = db[request.model].all().filter((item: any) => {
        let match = true;
        Object.entries(filters).forEach(([field, value]) => {
            if (request.filters && field in request.filters) {
                if (!request.filters[field](item, value as string, db)) match = false;
            } else {
                const { name, fn } = parseFilterField(field)
                if (name in item && !fn(item[name], value)) match = false
            }
        })
        return match;
    });

    items = sortItems(items, sort);

    const hasMany = db[request.model].hasMany;
    const includeList = include ? include.split(',') : [];
    items = items.map((item: any) => {
        Object.keys(item).forEach(field => {
            const rel = field.replace(/Ids$/, '');
            if (rel in hasMany && !includeList.includes(rel)) {
                delete item[field]
            }
        })
        return item;
    })

    if (request.settings.envelope === false) {
        return items;
    }

    let meta = {};
    const paginationSettings = request.settings.pagination;
    if (paginationSettings) {
        if (paginationSettings.type === 'page') {
            const { paginatedItems, paginationMeta } = paginateItems(items, page || 1, limit || paginationSettings.defaultLimit)
            items = paginatedItems
            meta = { ...meta, ...paginationMeta }
        }

        if (paginationSettings.type === 'cursor') {
            const { paginatedItems, paginationMeta } = cursorPaginate(items, cursor, limit || paginationSettings.defaultLimit);
            items = paginatedItems
            meta = { ...meta, ...paginationMeta }
        }
    }

    const included = {} as { [key: string]: any[] };
    includeList.forEach((field: string) => {
        const modelName = db[request.model].getRelatedModelName(field);
        included[modelName] = []
        items.forEach((item: any) => {
            const rels = db[request.model].getRelated(item.id, field);
            rels.forEach((rel: any) => {
                if (!included[modelName].find(r => r.id === rel.id)) included[modelName].push(rel)
            })
        })
    })


    return {
        data: items,
        meta,
        included
    }
}
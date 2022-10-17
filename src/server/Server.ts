import indexHandler from './handlers/list';
import createHandler from './handlers/create';
import updateHandler from './handlers/update';
import singletonGet from './handlers/singletonGet';
import singletonUpdate from './handlers/singletonUpdate';
import type { ModelSettings, ServerSettings, Settings } from '../types'
import singleHandler from './handlers/single';
import itemActionHandler from './handlers/itemAction';
import deleteHandler from './handlers/delete';
type RouteMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'

type RawRequest = {
    method: RouteMethod,
    url: string,
    body?: string,
}

type RouteHandler = (request: Request, db: any) => void;

type Route = {
    method: RouteMethod,
    path: string,
    handler: RouteHandler,
    model: string,
    settings: ModelSettings
}

// TODO merge this type with the one in index.ts
type ModelDefinition = {
    [key: string]: ModelSettings
}

type Filter<Db> = {
    [K in keyof Partial<Db>]: {
        // @ts-expect-error
        [field: string]: (item: Db[K]['items'][0], value: string, db: Db) => boolean
    }
}

export type Request = {
    json: object,
    query: object,
    params: { [key: string]: string },
    model: string,
    settings: ModelSettings,
    filters: {
        [field: string]: (item: any, value: string, db: any) => boolean
    },
}

export default class Server<DbType> {
    routes: Route[]
    customRoutes: Route[]
    db: DbType
    baseURL: string
    settings: ServerSettings
    idsAreNumbers: boolean
    filters: Filter<DbType>
    addDevtoolsEvent: ((event: any) => void) | undefined;
    events: any[];

    constructor(settings: Settings, models: ModelDefinition, db: DbType) {
        this.routes = [];
        this.customRoutes = [];
        this.db = db;
        this.baseURL = settings.baseURL || '';
        // @ts-expect-error
        if (window.cypressVroom) {
            // @ts-expect-error
            this.settings = window.cypressVroom.server.settings;
            // @ts-expect-error
            this.customRoutes = window.cypressVroom.server.customRoutes;
        } else {
            this.settings = settings.server || {};
        }
        this.idsAreNumbers = settings.idsAreNumbers || false;
        this.generateRoutes(models);
        this.setupInterceptor(this.baseURL);
        this.filters = {} as Filter<DbType>;
        this.events = [];
    }

    public reset() {
        type Truncatable = { truncate: () => void }
        Object.values(this.db as unknown as { [key: string]: Truncatable }).forEach(collection => {
            collection.truncate();
        })
        this.customRoutes = [];
    }

    public setDelay(delay: number) {
        this.settings.delay = delay;
    }

    protected generateRoutes(models: ModelDefinition) {
        Object.entries(models).forEach(([name, settings]) => {
            const actions = settings.only || ['index', 'create', 'read', 'update', 'delete'];
            const plural = settings.singleton ? name : settings.plural || `${name}s`;
            const path = settings.path || `/${plural}`;

            if (settings.singleton) {
                this.routes.push({ method: 'GET', path, handler: singletonGet, model: name, settings })
                this.routes.push({ method: 'PATCH', path, handler: singletonUpdate, model: name, settings })
                return;
            }

            if (actions.includes('index')) {
                this.routes.push({ method: 'GET', path, handler: indexHandler, model: name, settings })
            }
            if (actions.includes('create')) {
                this.routes.push({ method: 'POST', path, handler: createHandler, model: name, settings })
            }
            if (actions.includes('read')) {
                this.routes.push({ method: 'GET', path: `${path}/:id`, handler: singleHandler, model: name, settings })
            }
            if (actions.includes('update')) {
                this.routes.push({ method: 'PATCH', path: `${path}/:id`, handler: updateHandler, model: name, settings })
            }
            if (actions.includes('delete')) {
                this.routes.push({ method: 'DELETE', path: `${path}/:id`, handler: deleteHandler, model: name, settings })
            }

            // @ts-expect-error
            Object.entries(settings.itemActions).forEach(([verb, handler]) => {
                // @ts-expect-error
                this.routes.push({ method: 'POST', path: `${path}/:id/${verb}`, handler: itemActionHandler(handler), model: name, settings })
            })
        })
    }

    public get(path: string, handler: any) {
        this.customRoutes.push({
            method: 'GET',
            path,
            handler,
            model: '',
            settings: {}
        })
    }

    protected parseQuery(search: string) {
        const params = new URLSearchParams(search);
        const query = {} as { [key: string]: any };
        for (const k of params.keys()) {
            if (params.get(k) !== null) {
                let value = params.get(k) as any;
                if (['limit', 'page'].includes(k) || (k === 'cursor' && this.idsAreNumbers)) {
                    value = parseInt(value, 10)
                }
                query[k] = params.get(k);
            }

        }
        return query;
    }

    protected parseUrl(url: string, baseURL: string) {
        const baseUrlRemoved = url.startsWith(baseURL) ? url.slice(baseURL.length) : url;
        const [path, search] = baseUrlRemoved.split('?');
        return {
            path, query: this.parseQuery(search)
        }
    }

    protected getJsonBody(str: string) {
        return JSON.parse(str);
    }


    protected findMatchingRoute(method: RouteMethod, path: string) {
        const params = {} as { [key: string]: string };
        const matchedRoute = [...this.customRoutes, ...this.routes].find(route => {
            if (route.method !== method) return false;
            const paramNames = [...route.path.matchAll(/:([^/]+)/g)].map(match => match[1]);
            const expression = route.path.replace(/:[^/]+/g, '([^/]+)') + '$'
            const re = new RegExp(expression);
            const match = path.match(re);

            if (match) {
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                })
                return true;
            }
            return false;
        })

        if (matchedRoute) {
            return {
                route: matchedRoute,
                params,
            }
        }

        return { route: null, params: null };
    }

    protected parseRequest({
        method, url, body
    }: RawRequest, baseURL: string) {
        const { path, query } = this.parseUrl(url, baseURL);
        const jsonBody = body ? this.getJsonBody(body) : undefined;

        const { route, params } = this.findMatchingRoute(method, path);
        if (route) {
            const request = {
                query,
                json: jsonBody,
                params,
                model: route.model,
                settings: route.settings,
                // @ts-expect-error
                filters: this.filters ? this.filters[route.model] : {}
            }
            try {
                this.logEvent('🛫 ' + method, url.replace(this.baseURL, ''), {
                    params: request.params,
                    query: request.query,
                    body: request.json
                })
                const response = route.handler(request, this.db);
                console.groupCollapsed('%c' + method, 'background: green', url)
                console.log('Request', {
                    params: request.params,
                    query: request.query,
                    body: request.json
                })
                console.log('Response', response);
                console.groupEnd();
                return {
                    ok: true,
                    json() {
                        return response
                    }
                }
            }
            catch (e) {
                const error = e as any;
                if ('status' in error) {
                    console.groupCollapsed('%c' + method, 'background: red', url)
                    console.log('Request', {
                        params: request.params,
                        query: request.query,
                        body: request.json
                    })
                    console.log('Server Error', error.status, error.data);
                    console.groupEnd();

                    this.logEvent('🚨 Server Error', error.status, error.data, 'error')
                    return {
                        ok: false,
                        status: error.status,
                        json() {
                            return error.data
                        }
                    }
                }
            }
        }
        return null;

    }

    protected setupInterceptor(baseURL: string) {
        const originalFetch = window.fetch;

        // @ts-expect-error
        window.fetch = async (...args) => {
            const [path, config] = args;

            const customResponse = this.parseRequest({
                method: config ? config.method as RouteMethod : 'GET',
                url: path.toString(),
                body: config ? config.body?.toString() : ''
            }, baseURL)

            if (customResponse !== null) {
                const delay = this.settings.delay || 150
                await new Promise(r => setTimeout(r, delay));
                this.logEvent('🛬 Response', path.toString().replace(this.baseURL, ''), customResponse.json())
                return customResponse;
            }

            const response = await originalFetch(path, config);
            return response;
        }
    }

    public addFilters(obj: Filter<DbType>) {
        Object.entries(obj).forEach(([model, filter]) => {
            const key = model as keyof DbType
            if (!(model in this.filters)) {
                this.filters[key] = {};
            }
            this.filters[key] = {
                ...this.filters[key],
                // @ts-expect-error
                ...filter
            }
        })
    }

    protected logEvent(title: string, subtitle: string, data: any, logType = 'default') {
        this.events.push({ title, subtitle, data, logType })

        if (this.addDevtoolsEvent) {
            while (this.events.length > 0) {
                this.addDevtoolsEvent(this.events.shift())
            }
        }
    }

    public setDevTools(fn: (event: any) => void) {
        this.addDevtoolsEvent = fn;
        while (this.events.length > 0) {
            fn(this.events.shift());
        }
    }
}
import indexHandler from './handlers/list';
import createHandler from './handlers/create';
import updateHandler from './handlers/update';
import singletonGet from './handlers/singletonGet';
import singletonUpdate from './handlers/singletonUpdate';
import type {
  ApiNames,
  ModelSettings,
  ServerSettings,
  Settings,
} from '../types';
import singleHandler from './handlers/single';
import itemActionHandler from './handlers/itemAction';
import deleteHandler from './handlers/delete';
type RouteMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

type RawRequest = {
  method: RouteMethod;
  url: string;
  body?: string;
  headers?: object;
};

type RouteHandler = (request: Request, db: any, server?: any) => void;
type CustomRouteHandler<Db> = (
  request: SimpleRequest,
  db: Exclude<Db, null>
) => void;

type Route = {
  method: RouteMethod;
  path: string;
  handler: RouteHandler;
  model: string;
  settings: ModelSettings;
};

type ModelDefinition = {
  [key: string]: ModelSettings;
};

type Filter<Db> = {
  [K in keyof Partial<Db>]: {
    [field: string]: (
      // @ts-expect-error
      item: Db[K]['items'][0],
      value: string,
      db: Db
    ) => boolean;
  };
};

type SimpleRequest = {
  json: object;
  query: object;
  headers: object;
  params: { [key: string]: string };
};

export type Request = {
  json: object;
  query: object;
  params: { [key: string]: string };
  model: string;
  settings: ModelSettings;
  headers: object;
  filters: {
    [field: string]: (item: any, value: string, db: any) => boolean;
  };
};

export default class Server<DbType> {
  protected routes: Route[];
  protected customRoutes: Route[];
  protected overrides: Route[];
  protected db: DbType;
  protected baseURL: string;
  protected settings: ServerSettings;
  protected idsAreNumbers: boolean;
  protected filters: Filter<DbType>;
  protected addDevtoolsEvent: ((event: any) => void) | undefined;
  protected events: any[];
  naming: ApiNames;

  constructor(settings: Settings, models: ModelDefinition, db: DbType) {
    this.routes = [];
    this.customRoutes = [];
    this.overrides = [];
    this.db = db;
    this.baseURL = settings.baseURL || '';
    // @ts-expect-error
    if (window.cypressVroom) {
      // @ts-expect-error
      this.settings = window.cypressVroom.server.settings;
      // @ts-expect-error
      this.overrides = window.cypressVroom.server.overrides;
    } else {
      this.settings = settings.server || {};
    }
    this.idsAreNumbers = settings.idsAreNumbers || false;
    this.generateRoutes(models);
    this.setupInterceptor(this.baseURL);
    this.filters = {} as Filter<DbType>;
    this.events = [];
    this.naming = settings.naming as ApiNames;
  }

  /** Reset the server: truncates all db collections and removes overriden routes */
  public reset() {
    type Truncatable = { truncate: () => void };
    Object.values(this.db as unknown as { [key: string]: Truncatable }).forEach(
      (collection) => {
        collection.truncate();
      }
    );
    this.overrides = [];
  }

  /** Overwrite the response delay */
  public setDelay(delay: number) {
    this.settings.delay = delay;
  }

  protected generateRoutes(models: ModelDefinition) {
    Object.entries(models).forEach(([name, settings]) => {
      const actions = settings.only || [
        'index',
        'create',
        'read',
        'update',
        'delete',
      ];
      const plural = settings.singleton ? name : settings.plural || `${name}s`;
      const path = settings.path || `/${plural}`;

      if (settings.singleton) {
        this.routes.push({
          method: 'GET',
          path,
          handler: singletonGet,
          model: name,
          settings,
        });
        this.routes.push({
          method: 'PATCH',
          path,
          handler: singletonUpdate,
          model: name,
          settings,
        });
        return;
      }

      if (actions.includes('index')) {
        this.routes.push({
          method: 'GET',
          path,
          handler: indexHandler,
          model: name,
          settings,
        });
      }
      if (actions.includes('create')) {
        this.routes.push({
          method: 'POST',
          path,
          handler: createHandler,
          model: name,
          settings,
        });
      }
      if (actions.includes('read')) {
        this.routes.push({
          method: 'GET',
          path: `${path}/:id`,
          handler: singleHandler,
          model: name,
          settings,
        });
      }
      if (actions.includes('update')) {
        this.routes.push({
          method: 'PATCH',
          path: `${path}/:id`,
          handler: updateHandler,
          model: name,
          settings,
        });
      }
      if (actions.includes('delete')) {
        this.routes.push({
          method: 'DELETE',
          path: `${path}/:id`,
          handler: deleteHandler,
          model: name,
          settings,
        });
      }

      // @ts-expect-error
      Object.entries(settings.itemActions).forEach(([verb, handler]) => {
        this.routes.push({
          method: 'POST',
          path: `${path}/:id/${verb}`,
          // @ts-expect-error
          handler: itemActionHandler(handler),
          model: name,
          settings,
        });
      });
    });
  }

  protected addCustomRoute(
    method: RouteMethod,
    path: string,
    handler: CustomRouteHandler<DbType>
  ) {
    this.customRoutes.push({ method, path, handler, model: '', settings: {} });
  }

  protected override(
    method: RouteMethod,
    path: string,
    handler: CustomRouteHandler<DbType>
  ) {
    this.overrides.push({ method, path, handler, model: '', settings: {} });
  }

  /** Add a custom GET route */
  public get(path: string, handler: CustomRouteHandler<DbType>) {
    this.addCustomRoute('GET', path, handler);
  }

  /** Add a custom PATCH route */
  public patch(path: string, handler: CustomRouteHandler<DbType>) {
    this.addCustomRoute('PATCH', path, handler);
  }

  /** Add a custom POST route */
  public post(path: string, handler: CustomRouteHandler<DbType>) {
    this.addCustomRoute('POST', path, handler);
  }

  /** Add a custom DELETE route */
  public delete(path: string, handler: CustomRouteHandler<DbType>) {
    this.addCustomRoute('DELETE', path, handler);
  }

  /** Add a temporary GET route (will be removed if server.reset is called) */
  public overrideGet(path: string, handler: CustomRouteHandler<DbType>) {
    this.override('GET', path, handler);
  }

  /** Add a temporary PATCH route (will be removed if server.reset is called) */
  public overridePatch(path: string, handler: CustomRouteHandler<DbType>) {
    this.override('PATCH', path, handler);
  }

  /** Add a temporary POST route (will be removed if server.reset is called) */
  public overridePost(path: string, handler: CustomRouteHandler<DbType>) {
    this.override('POST', path, handler);
  }

  /** Add a temporary DELETE route (will be removed if server.reset is called) */
  public overrideDelete(path: string, handler: CustomRouteHandler<DbType>) {
    this.override('DELETE', path, handler);
  }

  protected parseQuery(search: string) {
    const params = new URLSearchParams(search);
    const query = {} as { [key: string]: any };
    for (const k of params.keys()) {
      if (params.get(k) !== null) {
        let value = params.get(k) as any;
        if (
          ['limit', 'page'].includes(k) ||
          (k === 'cursor' && this.idsAreNumbers)
        ) {
          value = parseInt(value, 10);
        }
        query[k] = params.get(k);
      }
    }
    return query;
  }

  protected parseUrl(url: string, baseURL: string) {
    const baseUrlRemoved = url.startsWith(baseURL)
      ? url.slice(baseURL.length)
      : url;
    const [path, search] = baseUrlRemoved.split('?');
    return {
      path,
      query: this.parseQuery(search),
    };
  }

  protected getJsonBody(str: string) {
    return JSON.parse(str);
  }

  protected findMatchingRoute(method: RouteMethod, path: string) {
    const params = {} as { [key: string]: string };
    const matchedRoute = [
      ...this.overrides,
      ...this.customRoutes,
      ...this.routes,
    ].find((route) => {
      if (route.method !== method) return false;
      const paramNames = [...route.path.matchAll(/:([^/]+)/g)].map(
        (match) => match[1]
      );
      const expression = route.path.replace(/:[^/]+/g, '([^/]+)') + '$';
      const re = new RegExp(expression);
      const match = path.match(re);

      if (match) {
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return true;
      }
      return false;
    });

    if (matchedRoute) {
      return {
        route: matchedRoute,
        params,
      };
    }

    return { route: null, params: null };
  }

  protected parseRequest(
    { method, url, body, headers }: RawRequest,
    baseURL: string
  ) {
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
        headers: headers || {},
        // @ts-expect-error
        filters: this.filters ? this.filters[route.model] : {},
      };
      try {
        this.logEvent('🛫 ' + method, url.replace(this.baseURL, ''), {
          params: request.params,
          query: request.query,
          body: request.json,
          headers,
        });
        const response = route.handler(request, this.db, this);
        return {
          ok: true,
          json() {
            return response;
          },
        };
      } catch (e) {
        const error = e as any;
        if ('status' in error) {
          this.logEvent('🚨 Server Error', error.status, error.data, 'error');
          return {
            ok: false,
            status: error.status,
            json() {
              return error.data;
            },
          };
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

      const customResponse = this.parseRequest(
        {
          method: config ? (config.method as RouteMethod) : 'GET',
          url: path.toString(),
          body: config ? config.body?.toString() : '',
          headers: config?.headers,
        },
        baseURL
      );

      if (customResponse !== null) {
        const delay = this.settings.delay || 150;
        await new Promise((r) => setTimeout(r, delay));
        this.logEvent(
          '🛬 Response',
          path.toString().replace(this.baseURL, ''),
          customResponse.json()
        );
        return customResponse;
      }

      const response = await originalFetch(path, config);
      return response;
    };
  }

  /** Add one or more custom filters */
  public addFilters(obj: Filter<DbType>) {
    Object.entries(obj).forEach(([model, filter]) => {
      const key = model as keyof DbType;
      if (!(model in this.filters)) {
        this.filters[key] = {};
      }
      this.filters[key] = {
        ...this.filters[key],
        // @ts-expect-error
        ...filter,
      };
    });
  }

  protected logEvent(
    title: string,
    subtitle: string,
    data: any,
    logType = 'default'
  ) {
    this.events.push({ title, subtitle, data, logType });

    if (this.addDevtoolsEvent) {
      while (this.events.length > 0) {
        this.addDevtoolsEvent(this.events.shift());
      }
    }
  }

  protected setDevTools(fn: (event: any) => void) {
    this.addDevtoolsEvent = fn;
    while (this.events.length > 0) {
      fn(this.events.shift());
    }
  }
}

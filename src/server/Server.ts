import indexHandler from './handlers/list';
import createHandler from './handlers/create';
import updateHandler from './handlers/update';
import singletonGet from './handlers/singletonGet';
import singletonUpdate from './handlers/singletonUpdate';
import type {
  ActionName,
  ApiNames,
  ModelSettings,
  ServerSettings,
  Settings,
} from '../types';
import singleHandler from './handlers/single';
import itemActionHandler from './handlers/itemAction';
import deleteHandler from './handlers/delete';
import bulkCreateHandler from './handlers/bulk-create';
import bulkUpdateHandler from './handlers/bulk-update';
import bulkDeleteHandler from './handlers/bulk-delete';
import ServerError from '../ServerError';
type RouteMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

type RawRequest = {
  method: RouteMethod;
  url: string;
  body?: string;
  headers: { [key: string]: string };
};

type RouteHandler = (request: Request, db: any, server?: any) => void;
type CustomRouteHandler<Db, IdentityModel> = (
  request: SimpleRequest<IdentityModel>,
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

type SideEffect<Db, IdentityModel> = {
  [K in keyof Partial<Db>]: {
    index?: (
      // @ts-expect-error
      items: Db[K]['items'][0][],
      db: Db,
      request: SimpleRequest<IdentityModel>
      // @ts-expect-error
    ) => Db[K]['items'][0][] | void;

    create?: (
      // @ts-expect-error
      item: Db[K]['items'][0],
      db: Db,
      request: SimpleRequest<IdentityModel>
      // @ts-expect-error
    ) => Db[K]['items'][0] | void;

    read?: (
      // @ts-expect-error
      item: Db[K]['items'][0],
      db: Db,
      request: SimpleRequest<IdentityModel>
      // @ts-expect-error
    ) => Db[K]['items'][0] | void;
    update?: (
      // @ts-expect-error
      item: Db[K]['items'][0],
      db: Db,
      request: SimpleRequest<IdentityModel>
      // @ts-expect-error
    ) => Db[K]['items'][0] | void;
    delete?: (
      // @ts-expect-error
      item: Db[K]['items'][0],
      db: Db,
      request: SimpleRequest<IdentityModel>
    ) => void;
  };
};

type SimpleRequest<IdentityModel> = {
  json: object;
  form: object;
  query: object;
  headers: object;
  params: { [key: string]: string };
  identity?: IdentityModel;
};

type ApiParams = { [key: string]: number | string };
type ApiBody = { [key: string]: unknown } | FormData;

type ApiRequest = {
  params?: ApiParams;
  body?: ApiBody;
};

export type Request = {
  json: object;
  form: object;
  query: object;
  params: { [key: string]: string };
  model: string;
  settings: ModelSettings;
  headers: object;
  filters: {
    [field: string]: (item: any, value: string, db: any) => boolean;
  };
  sideEffects: {
    [action in ActionName]?: (item: any, db: any, data?: any) => any | void;
  };
  identity: any;
};

export default class Server<DbType, IdentityModel> {
  protected routes: Route[];
  protected customRoutes: Route[];
  protected overrides: Route[];
  protected db: DbType;
  public identityModel: string;
  public identity: IdentityModel | null;
  protected baseURL: string;
  protected settings: ServerSettings;
  protected idsAreNumbers: boolean;
  protected filters: Filter<DbType>;
  protected sideEffects: SideEffect<DbType, IdentityModel>;
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
    this.identityModel = settings.identityModel
      ? settings.identityModel()
      : null;
    this.identity = null;
    this.generateRoutes(models);
    // this.setupInterceptor(this.baseURL);
    this.filters = {} as Filter<DbType>;
    this.sideEffects = {} as SideEffect<DbType, IdentityModel>;
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
        'bulk-create',
        'bulk-update',
        'bulk-delete',
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

      if (actions.includes('bulk-update')) {
        this.routes.push({
          method: 'PATCH',
          path: `${path}/bulk`,
          handler: bulkUpdateHandler,
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
      if (actions.includes('bulk-delete')) {
        this.routes.push({
          method: 'DELETE',
          path: `${path}/bulk`,
          handler: bulkDeleteHandler,
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
      if (actions.includes('bulk-create')) {
        this.routes.push({
          method: 'POST',
          path: `${path}/bulk`,
          handler: bulkCreateHandler,
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
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.customRoutes.push({ method, path, handler, model: '', settings: {} });
  }

  protected override(
    method: RouteMethod,
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.overrides.push({ method, path, handler, model: '', settings: {} });
  }

  /** Add a custom GET route */
  public get(path: string, handler: CustomRouteHandler<DbType, IdentityModel>) {
    this.addCustomRoute('GET', path, handler);
  }

  /** Add a custom PATCH route */
  public patch(
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.addCustomRoute('PATCH', path, handler);
  }

  /** Add a custom POST route */
  public post(
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.addCustomRoute('POST', path, handler);
  }

  /** Add a custom DELETE route */
  public delete(
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.addCustomRoute('DELETE', path, handler);
  }

  /** Add a temporary GET route (will be removed if server.reset is called) */
  public overrideGet(
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.override('GET', path, handler);
  }

  /** Add a temporary PATCH route (will be removed if server.reset is called) */
  public overridePatch(
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.override('PATCH', path, handler);
  }

  /** Add a temporary POST route (will be removed if server.reset is called) */
  public overridePost(
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
    this.override('POST', path, handler);
  }

  /** Add a temporary DELETE route (will be removed if server.reset is called) */
  public overrideDelete(
    path: string,
    handler: CustomRouteHandler<DbType, IdentityModel>
  ) {
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
        query[k] = value;
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

    const isForm = headers['Content-Type'] === 'multipart/form-data';

    const formBody = isForm ? body : undefined;
    const jsonBody = body && !isForm ? this.getJsonBody(body) : undefined;

    if (headers['authorization'] && this.identityModel) {
      const [, token] = headers['authorization'].split(' ');
      // @ts-expect-error
      this.identity = this.db[this.identityModel].find(token);
    }

    const { route, params } = this.findMatchingRoute(method, path);

    this.logEvent('🛫 ' + method, url.replace(this.baseURL, ''), {
      params: params,
      query: query,
      body: jsonBody,
      headers,
    });
    try {
      if (!route) {
        throw new ServerError(404, { type: 'route_not_found', method, path });
      }

      const request = {
        query,
        json: jsonBody,
        form: formBody,
        params,
        model: route.model,
        settings: route.settings,
        headers: headers || {},
        // @ts-expect-error
        filters: this.filters ? this.filters[route.model] : {},
        // @ts-expect-error
        sideEffects: this.sideEffects ? this.sideEffects[route.model] : {},
        identity: this.identity,
      };

      return route.handler(request as any, this.db, this);
    } catch (e) {
      if (e instanceof ServerError) {
        this.logEvent(
          '🚨 ' + e.status.toString(),
          method + ' ' + url.replace(this.baseURL, ''),
          e.data,
          'error'
        );
      }
      // Rethrow the error
      throw e;
    }
  }

  public async handleRequest(
    method: RouteMethod,
    url: string,
    body: string,
    headers: { [key: string]: string }
  ) {
    const response = this.parseRequest(
      {
        method,
        url,
        body,
        headers,
      },
      this.baseURL
    );

    await new Promise((r) =>
      setTimeout(
        r,
        this.settings.delay === undefined ? 150 : this.settings.delay
      )
    );

    this.logEvent(
      '🛬 Response',
      url.toString().replace(this.baseURL, ''),
      response
    );

    return response;
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

  /** Add on or more sideffects */
  public addSideEffects(obj: SideEffect<DbType, IdentityModel>) {
    Object.entries(obj).forEach(([model, sideEffect]) => {
      const key = model as keyof DbType;
      if (!(model in this.sideEffects)) {
        this.sideEffects[key] = {};
      }
      this.sideEffects[key] = {
        ...this.sideEffects[key],
        // @ts-expect-error
        ...sideEffect,
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

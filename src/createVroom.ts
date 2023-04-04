import type { Settings, FieldTypes, IdType } from './types';
import createDb, { VroomDb } from './server/createDb';
import createServer from './server/createServer';
import createStores from './createStores';
import createCache from './createCache';
import setupDevtools from './devtools';
import FetchList from './FetchList.vue';
import FetchSingle from './FetchSingle.vue';
import FetchSingleton from './FetchSingleton.vue';
import api from './api';
import Sockets from './sockets';
import Mocket from './server/Mocket';
import type { InjectionKey } from 'vue';
import createComponent from './democomponent';

export default function createVroom<Options extends Settings & { models: any }>(
  options: Options
) {
  type ModelTypes = FieldTypes<Options['models'], IdType<Options>>;
  type IdentityModel = ModelTypes[ReturnType<Options['identityModel']>];

  const { models, ...settings } = options;

  const namingWithDefault = {
    data: options.naming?.data || 'data',
    dataSingle: options.naming?.dataSingle || 'data',
    included: options.naming?.included || 'included',
    meta: options.naming?.meta || 'meta',
  };

  settings.naming = namingWithDefault;

  const db = __DEV__ ? createDb<ModelTypes>(options) : null;
  const server = __DEV__
    ? createServer<typeof db, IdentityModel>(settings, models, db)
    : null;
  const mocket =
    __DEV__ && settings.server?.enable
      ? new Mocket<typeof db, IdentityModel>(
          db,
          settings.identityModel ? settings.identityModel() : null
        )
      : null;

  const socket = new Sockets<ModelTypes>(
    settings.ws,
    mocket as any as typeof Mocket
  );

  const stores = createStores<ModelTypes, Options['models']>(
    models,
    settings.baseURL,
    namingWithDefault
  );

  const cache = createCache(stores);

  return {
    api,
    db: db as VroomDb<Options['models'], IdType<Options>['id']>,
    settings,
    server,
    stores,
    cache,
    socket,
    mocket,
    types: {} as ModelTypes,
    install(app: any) {
      app.provide('stores', stores);
      app.provide('models', models);
      app.provide('cache', cache);
      app.provide('socket', socket);
      app.provide('vroomTypes', {} as ModelTypes);
      app.component('FetchList', FetchList);
      app.component('FetchSingle', FetchSingle);
      app.component('FetchSingleton', FetchSingleton);

      if (__DEV__ && server) {
        setupDevtools(app, db, server);
      }
    },
  };
}

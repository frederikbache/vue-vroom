import type { Settings, FieldTypes, IdType } from './types';
import createDb, { VroomDb } from './server/createDb';
import createServer from './server/createServer';
import createStores from './createStores';
import createCache from './createCache';
import setupDevtools from './devtools';
import FetchList from './FetchList.vue';
import FetchSingle from './FetchSingle.vue';
import FetchSingleton from './FetchSingleton.vue';
import createApi from './api';
import createUseList from './components/createUseList';
import createUseSingle from './components/createUseSingle';
import createUseSingleton from './components/createUseSingleton';

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
  const api = createApi(server);

  const stores = createStores<ModelTypes, Options['models']>(
    models,
    settings.baseURL,
    namingWithDefault,
    api
  );

  const cache = createCache(stores);

  return {
    api,
    db: db as VroomDb<Options['models'], IdType<Options>['id']>,
    settings,
    server,
    stores,
    cache,
    types: {} as ModelTypes,
    useList: createUseList<ModelTypes, IdType<Options>['id']>(
      models,
      stores,
      cache
    ),
    useSingle: createUseSingle<ModelTypes, IdType<Options>['id']>(
      models,
      stores,
      cache
    ),
    useSingleton: createUseSingleton<ModelTypes>(stores),
    install(app: any) {
      app.provide('stores', stores);
      app.provide('models', models);
      app.provide('cache', cache);
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

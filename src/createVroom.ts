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

export default function createVroom<Options extends Settings & { models: any }>(
  options: Options
) {
  type ModelTypes = FieldTypes<Options['models'], IdType<Options>>;

  const { models, ...settings } = options;

  const db = __DEV__ ? createDb<ModelTypes>(options) : null;
  const server = __DEV__ ? createServer(settings, models, db) : null;
  const stores = createStores<ModelTypes, Options['models']>(
    models,
    settings.baseURL
  );
  const cache = createCache(stores);

  return {
    api,
    db: db as VroomDb<Options['models'], IdType<Options>['id']>,
    settings,
    server,
    stores,
    types: {} as ModelTypes,
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

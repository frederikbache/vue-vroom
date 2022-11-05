import { defineStore, type StoreDefinition } from 'pinia';
import api from './api';
import { ID, ApiNames } from './types';
import createValidator from './validateResponse';

type SortSettings = {
  field: string;
  dir?: 'ASC' | 'DESC';
};

type PaginationSettings = {
  page?: number;
  limit?: number;
  cursor?: number | string;
};

type StoreSettings = {
  path: string;
  envelope?: boolean;
  itemActions: {
    [key: string]: (id: any) => any;
  };
};

let validator: ReturnType<typeof createValidator>;
const stores = {} as any;

function parseFilters(filterSettings: any) {
  const filters = {} as any;
  Object.entries(filterSettings).forEach(([field, obj]) => {
    if (
      typeof obj === 'string' ||
      typeof obj === 'number' ||
      typeof obj === 'boolean'
    ) {
      filters[field] = obj;
    } else if (obj && typeof obj === 'object') {
      let operator = '';
      let val;
      ['gt', 'lt', 'gte', 'lte', 'contains'].forEach((op) => {
        if (op in obj) {
          operator = op;
          val = (obj as any)[op];
        }
      });

      ['between'].forEach((op) => {
        if (op in obj) {
          operator = op;
          val = (obj as any)[op].join(',');
        }
      });
      if (val) {
        filters[`${field}[${operator}]`] = val;
      }
    }
  });

  return filters;
}

function createSortString(sort: SortSettings[]) {
  return sort.map((v) => (v.dir === 'DESC' ? '-' : '') + v.field).join(',');
}

function createSingletonStore(
  name: string,
  baseURL = '',
  settings: StoreSettings,
  naming: ApiNames
) {
  const endpoint = settings.path
    ? baseURL + settings.path
    : `${baseURL}/${name}`;

  return defineStore('vroom:' + name, {
    state: () => ({
      item: null as any,
    }),
    getters: {
      single: (state) => state.item,
    },
    actions: {
      $fetch(filter: any, overridePath: string | null) {
        let params = {
          ...parseFilters(filter),
        };
        return api.get(overridePath || endpoint, params).then((res) => {
          if (settings.envelope === false) {
            this.item = res;
            return res;
          }
          this.item = res[naming.dataSingle];
          return res[naming.dataSingle];
        });
      },
      update(patchData: any, filter = {}) {
        let params = {
          ...parseFilters(filter),
        };
        return api.patch(endpoint, patchData, params).then((item) => {
          this.item = { ...item };
        });
      },
    },
  });
}

function createStore(
  name: string,
  modelName: string,
  baseURL = '',
  settings: StoreSettings,
  naming: ApiNames
) {
  const endpoint = settings.path
    ? baseURL + settings.path
    : `${baseURL}/${name}`;
  const methods = {} as any;
  Object.keys(settings.itemActions).forEach((verb) => {
    methods[verb] = function (id: any) {
      return api.post(`${endpoint}/${id}/${verb}`).then((item) => {
        (this as any).add([item]);
      });
    };
  });

  return defineStore('vroom:' + name, {
    state: () => ({
      items: [] as any[],
    }),
    getters: {
      list(state) {
        return (ids: ID[]) =>
          state.items.filter((item) => ids.includes(item.id));
      },
      single(state) {
        return (id: ID) => state.items.find((item) => item.id === id);
      },
    },
    actions: {
      ...methods,
      add(items: any[]) {
        const all = [...this.items];
        items.forEach((item) => {
          const index = all.findIndex((i) => i.id === item.id);
          if (index !== -1) {
            all[index] = { ...all[index], ...item };
          } else {
            all.push(item);
          }
        });
        this.items = all;
      },
      $list(
        filter: any,
        pagination: PaginationSettings,
        sort: SortSettings[],
        include: string[],
        overridePath: string | null
      ) {
        let params = {
          ...parseFilters(filter),
          ...pagination,
        };
        if (sort.length) params.sort = createSortString(sort);
        if (include.length) params.include = include.join(',');
        const url = overridePath || endpoint;

        return api.get(url, params).then((res) => {
          if (settings.envelope === false) {
            this.add(res);
            return { items: res };
          }
          const items = res[naming.data];
          const included = res[naming.included] || {};
          const meta = res[naming.meta] || {};

          validator.list(url, params, modelName, res);

          this.add(items);
          Object.entries(included).forEach(([name, models]) => {
            stores[name]().add(models);
          });
          return { items, meta, included };
        });
      },
      $single(id: ID, include: string[], overridePath: string | null) {
        let params = {} as any;
        if (include.length) params.include = include.join(',');
        const url = overridePath || endpoint + '/' + id;
        return api.get(url, params).then((res) => {
          if (settings.envelope === false) {
            this.add([res]);
            return res;
          }
          const item = res[naming.dataSingle];
          const included = res[naming.included] || {};
          const meta = res[naming.meta] || {};

          validator.single(url, params, modelName, res);
          this.add([item]);
          Object.entries(included).forEach(([name, models]) => {
            stores[name]().add(models);
          });
          return { item, meta, included };
        });
      },
      create(postData: any) {
        return api.post(endpoint, postData).then((item) => {
          this.add([item]);
          return item;
        });
      },
      update(id: ID, patchData: any) {
        return api.patch(endpoint + '/' + id, patchData).then((item) => {
          this.add([item]);
        });
      },
      localUpdate(id: ID, patchData: any) {
        this.add([{ id, ...patchData }]);
      },
      delete(id: ID) {
        return api.delete(endpoint + '/' + id).then(() => {
          this.items = this.items.filter((item: any) => item.id !== id);
        });
      },
      garbageCollect(ids: ID[]) {
        this.items = this.items.filter((item: any) => !ids.includes(item.id));
      },
    },
  });
}

type ItemActions<T, ModelT> = {
  // @ts-expect-error
  [Property in keyof T]: (id: ModelT['id'], data?: any) => Promise<ModelT>;
};

export default function createStores<Type, ModelInfo>(
  models: any,
  baseURL = '',
  naming: ApiNames
) {
  Object.keys(models).forEach((name) => {
    const storeName = models[name].plural || `${name}s`;

    if (models[name].singleton) {
      stores[name] = createSingletonStore(name, baseURL, models[name], naming);
    } else {
      stores[name] = createStore(
        storeName,
        name,
        baseURL,
        models[name],
        naming
      );
    }
  });

  validator = createValidator(models, naming);

  return stores as {
    // @ts-expect-error
    [K in keyof Type]: ModelInfo[K] extends { singleton: boolean }
      ? StoreDefinition<
          // @ts-expect-error
          K,
          { item: Omit<Type[K], 'id'> },
          {},
          // @ts-expect-error
          ItemActions<ModelInfo[K]['itemActions'], Omit<Type[K], 'id'>> & {
            update: (
              data: Partial<Type[K]>,
              filter?: object
            ) => Promise<Omit<Type[K], 'id'>>;
          }
        >
      : StoreDefinition<
          // @ts-expect-error
          K,
          { items: Type[K][] },
          {
            single: () => (id: ID) => Type[K];
          },
          // @ts-expect-error
          ItemActions<ModelInfo[K]['itemActions'], Type[K]> & {
            create: (data: Partial<Type[K]>) => Promise<Type[K]>;

            update: (
              // @ts-expect-error
              id: Type[K]['id'],
              data: Partial<Type[K]>
            ) => Promise<Type[K]>;
            localUpdate: (
              // @ts-expect-error
              id: Type[K]['id'],
              data: Partial<Type[K]>
            ) => Promise<Type[K]>;
            // @ts-expect-error
            delete: (id: Type[K]['id']) => Promise<void>;
          }
        >;
  };
}

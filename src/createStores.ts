import { defineStore, type StoreDefinition } from 'pinia';
import api from './api';
import { ID, HasId } from './types';

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
  settings: StoreSettings
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
      $fetch() {
        return api.get(endpoint).then((res) => {
          if (settings.envelope === false) {
            this.item = res;
            return res;
          }
          this.item = res.data;
          return res.data;
        });
      },
      update(patchData: any) {
        return api.patch(endpoint, patchData).then((item) => {
          this.item = { ...item };
        });
      },
    },
  });
}

function createStore(name: string, baseURL = '', settings: StoreSettings) {
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
        include: string[]
      ) {
        let params = {
          ...parseFilters(filter),
          ...pagination,
        };
        if (sort.length) params.sort = createSortString(sort);
        if (include.length) params.include = include.join(',');

        return api.get(endpoint, params).then((res) => {
          if (settings.envelope === false) {
            this.add(res);
            return { items: res };
          }
          this.add(res.data);
          Object.entries(res.included).forEach(([name, models]) => {
            stores[name]().add(models);
          });
          return {
            items: res.data,
            meta: res.meta,
            included: res.included,
          };
        });
      },
      $single(id: ID, include: string[]) {
        let params = {} as any;
        if (include.length) params.include = include.join(',');
        return api.get(endpoint + '/' + id, params).then((res) => {
          if (settings.envelope === false) {
            this.add([res]);
            return res;
          }
          this.add([res.data]);
          if (res.included) {
            Object.entries(res.included).forEach(([name, models]) => {
              stores[name]().add(models);
            });
          }
          return {
            item: res.data,
            meta: res.meta,
            included: res.included,
          };
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
  baseURL = ''
) {
  Object.keys(models).forEach((name) => {
    const storeName = models[name].plural || `${name}s`;
    if (models[name].singleton) {
      stores[name] = createSingletonStore(name, baseURL, models[name]);
    } else {
      stores[name] = createStore(storeName, baseURL, models[name]);
    }
  });

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
            update: (data: Partial<Type[K]>) => Promise<Omit<Type[K], 'id'>>;
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

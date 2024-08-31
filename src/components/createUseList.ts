import {
  type Ref,
  computed,
  onUnmounted,
  ref,
  watch,
  type ComputedRef,
} from 'vue';
import useFetchState from '../useFetchState';
import unwrap from './unwrap';
import helper from '../helper';

type R<T> = T | Ref<T | undefined> | ComputedRef<T | undefined>;

type FilterType<Models, Model extends keyof Models> = {
  [key in keyof Models[Model]]?: R<Models[Model][key]>;
};

type SortType<Models, Model extends keyof Models> = {
  field: R<keyof Models[Model]>;
  dir: R<'ASC' | 'DESC'>;
}[];

type PaginationSettings<IdType> = {
  page?: R<number>;
  limit?: R<number>;
  cursor?: R<IdType>;
};

type IncludeType<Models, Model extends keyof Models> = Array<
  keyof Models[Model]
>;

type OptionsType<Models, Model extends keyof Models, IdType> = {
  filter?: R<FilterType<Models, Model>>;
  pagination?: R<PaginationSettings<IdType>>;
  sort?: R<SortType<Models, Model>>;
  include?: R<IncludeType<Models, Model>>;
  mergePages?: boolean;
  path?: string;
  loadOnUpdate?: boolean;
  lazy?: boolean;
  throttle?: number;
};

export default function createUseList<Models, IdType, ListMetaTypes>(
  models: any,
  stores: any,
  cache: any
) {
  return function useList<const ModelName extends keyof Models>(
    model: ModelName,
    options: OptionsType<Models, ModelName, IdType> = {}
  ) {
    type ItemType = Models[ModelName];

    // @ts-ignore
    type ListMetaType = ListMetaTypes[ModelName];

    const store = stores[model]();
    const cacheStore = cache();
    const ids = ref([] as IdType[]);
    const meta = ref(
      {} as {
        nextCursor?: IdType;
        page: number;
        pages: number;
        results: number;
      } & ListMetaType
    );
    const lastPagination = ref('');

    const modelSettings = models[model];

    const filters = computed(() =>
      options.filter ? unwrap(options.filter) : {}
    );
    const pagination = computed(() =>
      options.pagination ? unwrap(options.pagination) : {}
    );
    const sort = computed(() => (options.sort ? unwrap(options.sort) : {}));
    const include = computed(() =>
      options.include ? unwrap(options.include) : []
    );
    const path = computed(() => (options.path ? unwrap(options.path) : null));
    const lazy = computed(() =>
      options.lazy !== undefined ? unwrap(options.lazy) : false
    );

    const autoFetch = computed(() => !lazy.value);

    const throttleTimeout = ref(null as ReturnType<typeof setTimeout> | null);
    const lastRequest = ref(undefined as number | undefined);

    const { error, state, hasLoaded, isLoading, isFailed, handleError } =
      useFetchState(!!options.loadOnUpdate);

    if (modelSettings.includable) {
      include.value.forEach((i: string) => {
        if (!modelSettings.includable.includes(i)) {
          throw new Error(
            `Vroom: model ${
              model as string
            } does not have an includable relation ${i}`
          );
        }
      });
    }

    const requestKey = Math.random() * performance.now();

    function checkThrottle() {
      if (options.throttle) {
        const now = Date.now();
        if (throttleTimeout.value) clearTimeout(throttleTimeout.value);
        if (lastRequest.value && now - lastRequest.value < options.throttle) {
          throttleTimeout.value = setTimeout(() => {
            fetch();
          }, options.throttle - (now - lastRequest.value));
          return false;
        }
        lastRequest.value = now;
      }
      return true;
    }

    /**
     * Fetch list
     */
    function fetch() {
      if (!checkThrottle()) return;
      state.value = 'loading';
      store
        .$list(
          filters.value,
          pagination.value,
          sort.value,
          include.value,
          path.value,
          requestKey
        )
        .then((res: any) => {
          const paginationChanged =
            lastPagination.value !== JSON.stringify(pagination.value);
          lastPagination.value = JSON.stringify(pagination.value);
          const resIds = res.items.map((item: any) => item.id);
          ids.value =
            options.mergePages && paginationChanged
              ? [...ids.value, ...resIds]
              : resIds;
          state.value = 'none';
          meta.value = res.meta;
          hasLoaded.value = true;
        })
        .catch(handleError);
    }

    // Run the fetch
    if (autoFetch.value) {
      fetch();
    }

    const filterString = computed(
      () =>
        JSON.stringify(filters.value) +
        '|' +
        JSON.stringify(pagination.value) +
        '|' +
        JSON.stringify(sort.value)
    );

    // Run fetch when the filter changes
    watch(filterString, () => {
      if (autoFetch.value) fetch();
    });

    watch(autoFetch, () => {
      if (autoFetch.value) fetch();
    });

    /**
     * Load the items
     */

    const relations = computed(() => ({
      ...modelSettings.hasMany,
      ...modelSettings.belongsTo,
    }));

    const itemsWithInclude = computed(() => {
      let all = store
        .list(ids.value)
        .sort(
          (a: any, b: any) => ids.value.indexOf(a.id) - ids.value.indexOf(b.id)
        );
      const includedIds = {} as any;

      include.value.forEach((rel: any) => {
        const isHasMany = rel in modelSettings.hasMany;
        const relModel = relations.value[rel]();
        const relStore = stores[relModel]();
        if (!includedIds[relModel]) {
          includedIds[relModel] = [];
        }
        all = all.map((item: any) => {
          const nestedItem = { ...item };
          if (isHasMany) {
            includedIds[relModel].push(...item[helper.addHasManyPostFix(rel)]);
            nestedItem[rel] = relStore.list(
              item[helper.addHasManyPostFix(rel)]
            );
          } else {
            includedIds[relModel].push(item[helper.addBelongsToPostFix(rel)]);
            nestedItem[rel] = relStore.single(
              item[helper.addBelongsToPostFix(rel)]
            );
          }
          return nestedItem;
        });
      });

      return { items: all as ItemType[], includedIds };
    });

    const items = computed(() => {
      const { items } = itemsWithInclude.value;
      return items;
    });

    const includedIds = computed(() => {
      const { includedIds } = itemsWithInclude.value;
      return includedIds;
    });

    /**
     * Utility functions
     */

    // Push id
    const pushId = (id: IdType) => {
      ids.value = [...ids.value, id as any];
    };

    // Create
    const create = (data: Partial<ItemType>) => {
      return store.create(data).then((item: ItemType) => {
        // After create, push id to ids, to add to list
        pushId((item as any).id);
        return item;
      });
    };

    /**
     * Cache control
     */

    // Update cache subscriptions when ids change
    watch(ids, (newIds, oldIds) => {
      cacheStore.subscribe(model, newIds);
      cacheStore.unsubscribe(model, oldIds);
    });
    watch(includedIds, (newIds, oldIds) => {
      Object.keys(newIds).forEach((model) => {
        cacheStore.subscribe(model, newIds[model]);
      });
      Object.keys(oldIds).forEach((model) => {
        cacheStore.unsubscribe(model, oldIds[model]);
      });
    });
    // Unsubscribe from ids when unmounting
    onUnmounted(() => {
      cacheStore.unsubscribe(model, ids.value);
      Object.keys(includedIds.value).forEach((model) => {
        cacheStore.unsubscribe(model, includedIds.value[model]);
      });
    });

    return {
      items,
      create,
      pushId,
      refresh: fetch,
      isLoading,
      isFailed,
      error,
      meta,
    };
  };
}

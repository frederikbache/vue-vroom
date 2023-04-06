import {
  type Ref,
  computed,
  onUnmounted,
  ref,
  watch,
  type ComputedRef,
} from 'vue';
import useFetchState from '../useFetchState';

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
};

function unwrap(item: any): any {
  if (Array.isArray(item)) {
    return item.map(unwrap);
  } else if (typeof item === 'object') {
    if (!item) return item;
    if ('value' in item) return unwrap(item.value);
    const unwrappedObject = {} as any;
    Object.entries(item).forEach(([key, val]) => {
      unwrappedObject[key] = unwrap(val);
    });
    return unwrappedObject;
  }

  return item;
}

export default function createUseList<Models, IdType>(
  models: any,
  stores: any,
  cache: any
) {
  return function useList<const ModelName extends keyof Models>(
    model: ModelName,
    options: OptionsType<Models, ModelName, IdType> = {}
  ) {
    type ItemType = Models[ModelName];

    const store = stores[model]();
    const cacheStore = cache();
    const ids = ref([] as IdType[]);
    const meta = ref({} as any);

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

    const { error, state, hasLoaded, isLoading, isFailed, handleError } =
      useFetchState(!!options.loadOnUpdate);

    /**
     * Fetch list
     */
    function fetch() {
      state.value = 'loading';
      store
        .$list(
          filters.value,
          pagination.value,
          sort.value,
          include.value,
          path.value
        )
        .then((res: any) => {
          const resIds = res.items.map((item: any) => item.id);
          ids.value = options.mergePages ? [...ids.value, ...resIds] : resIds;
          state.value = 'none';
          meta.value = res.meta;
          hasLoaded.value = true;
        })
        .catch(handleError);
    }

    // Run the fetch
    fetch();

    const filterString = computed(
      () =>
        JSON.stringify(filters.value) +
        '|' +
        JSON.stringify(pagination.value) +
        '|' +
        JSON.stringify(sort.value)
    );

    // Run fetch when the filter changes
    watch(filterString, fetch);

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
            includedIds[relModel].push(...item[`${rel}Ids`]);
            nestedItem[rel] = relStore.list(item[`${rel}Ids`]);
          } else {
            includedIds[relModel].push(item[`${rel}Id`]);
            nestedItem[rel] = relStore.single(item[`${rel}Id`]);
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
      store.create(data).then((item: any) => {
        // After create, push id to ids, to add to list
        pushId(item.id);
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
      meta: meta as {
        nextCursor?: IdType;
        page: number;
        pages: number;
        results: number;
      },
    };
  };
}

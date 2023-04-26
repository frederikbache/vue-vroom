import {
  type Ref,
  computed,
  onUnmounted,
  ref,
  watch,
  type ComputedRef,
  nextTick,
} from 'vue';
import useFetchState from '../useFetchState';
import unwrap from './unwrap';

type R<T> = T | Ref<T | undefined> | ComputedRef<T | undefined>;

type IncludeType<Models, Model extends keyof Models> = Array<
  keyof Models[Model]
>;

type OptionsType<Models, Model extends keyof Models> = {
  include?: R<IncludeType<Models, Model>>;
  path?: string;
  loadOnUpdate?: boolean;
  lazy?: boolean;
};

export default function createUseSingle<Models, IdType>(
  models: any,
  stores: any,
  cache: any
) {
  return function useSingle<const ModelName extends keyof Models>(
    model: ModelName,
    id: R<IdType>,
    options: OptionsType<Models, ModelName> = {}
  ) {
    type ItemType = Models[ModelName];

    const store = stores[model]();
    const cacheStore = cache();
    const includedIds = ref({} as any);

    const modelSettings = models[model];

    const singleId = computed(() => unwrap(id));
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
        .$single(singleId.value, include.value, path.value)
        .then((res: any) => {
          state.value = 'none';
          const newIncludeIds = {} as any;
          if (res.included) {
            Object.keys(res.included).forEach((name) => {
              newIncludeIds[name] = res.included[name].map((m: any) => m.id);
            });
          }
          includedIds.value = newIncludeIds;
          hasLoaded.value = true;
        })
        .catch(handleError);
    }

    // Run the fetch
    if (!options.lazy) {
      fetch();
    }

    cacheStore.subscribe(model, [singleId.value]);
    watch(singleId, (newId, oldId) => {
      cacheStore.subscribe(model, [newId]);
      cacheStore.unsubscribe(model, [oldId]);
      if (!options.lazy) fetch();
    });

    /**
     * Load the items
     */

    const relations = computed(() => ({
      ...modelSettings.hasMany,
      ...modelSettings.belongsTo,
    }));

    const item = computed<ItemType>(() => {
      // TODO return null if not loaded yet?
      const item = { ...store.single(singleId.value) };
      include.value.forEach((rel: string) => {
        const hasMany = rel in modelSettings.hasMany;
        const relStore = stores[relations.value[rel]()]();
        if (hasMany) {
          item[rel] = relStore.items.filter((relItem: any) =>
            item[rel + 'Ids'].includes(relItem.id)
          );
        } else {
          item[rel] = relStore.items.find(
            (relItem: any) => item[rel + 'Id'] === relItem.id
          );
        }
      });
      return item;
    });

    /**
     * Cache control
     */

    // Update cache subscriptions when ids change

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
      cacheStore.unsubscribe(model, [singleId.value]);
      Object.keys(includedIds.value).forEach((model) => {
        cacheStore.unsubscribe(model, includedIds.value[model]);
      });
    });

    return {
      item,
      refresh: fetch,
      isLoading,
      isFailed,
      error,
    };
  };
}

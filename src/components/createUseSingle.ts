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

export type R<T> = T | Ref<T | undefined> | ComputedRef<T | undefined>;

type IncludeType<Models, Model extends keyof Models> = Array<
  keyof Models[Model]
>;

type OptionsType<Models, Model extends keyof Models> = {
  include?: R<IncludeType<Models, Model>>;
  path?: string;
  loadOnUpdate?: boolean;
  lazy?: boolean;
  preferCache?: boolean;
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

    const autoFetch = computed(() => {
      if (!singleId.value) return false;
      if (options.lazy) return false;
      if (options.preferCache) {
        if (!!store.single(singleId.value)) return false;
      }
      return true;
    });

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
    if (autoFetch.value) {
      fetch();
    }

    cacheStore.subscribe(model, [singleId.value]);
    watch(singleId, (newId, oldId) => {
      cacheStore.subscribe(model, [newId]);
      cacheStore.unsubscribe(model, [oldId]);
      if (autoFetch.value) fetch();
    });

    /**
     * Load the items
     */

    const relations = computed(() => ({
      ...modelSettings.hasMany,
      ...modelSettings.belongsTo,
    }));

    const item = computed<ItemType | null>(() => {
      if (!singleId.value) return null;
      const stored = store.single(singleId.value);
      if (!stored) return null;
      const item = { ...stored };
      include.value.forEach((rel: string) => {
        const hasMany = rel in modelSettings.hasMany;
        const relStore = stores[relations.value[rel]()]();
        if (hasMany) {
          if (!item[helper.addHasManyPostFix(rel)]) return;
          item[rel] = relStore.items.filter((relItem: any) =>
            item[helper.addHasManyPostFix(rel)].includes(relItem.id)
          );
        } else {
          if (!item[helper.addBelongsToPostFix(rel)]) return;
          item[rel] = relStore.items.find(
            (relItem: any) =>
              item[helper.addBelongsToPostFix(rel)] === relItem.id
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

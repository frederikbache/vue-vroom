import { type Ref, computed, watch, type ComputedRef } from 'vue';
import useFetchState from '../useFetchState';
import unwrap from './unwrap';

type R<T> = T | Ref<T | undefined> | ComputedRef<T | undefined>;

type FilterType<Models, Model extends keyof Models> = {
  [key in keyof Models[Model]]?: R<Models[Model][key]>;
};

type OptionsType<Models, Model extends keyof Models> = {
  filter?: R<FilterType<Models, Model>>;
  path?: string;
  loadOnUpdate?: boolean;
};

export default function createUseSingleton<Models>(stores: any) {
  return function useSingleton<const ModelName extends keyof Models>(
    model: ModelName,
    options: OptionsType<Models, ModelName> = {}
  ) {
    type ItemType = Models[ModelName];

    const store = stores[model]();

    const filters = computed(() =>
      options.filter ? unwrap(options.filter) : {}
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
        .$fetch(filters.value, path.value)
        .then((res: any) => {
          state.value = 'none';
          hasLoaded.value = true;
        })
        .catch(handleError);
    }

    // Run the fetch
    fetch();

    const filterString = computed(() => JSON.stringify(filters.value));

    // Run fetch when the filter changes
    watch(filterString, fetch);

    /**
     * Load the item
     */
    const item = computed<ItemType>(() => {
      return store.item;
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

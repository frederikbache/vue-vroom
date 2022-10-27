import { computed, ref, useSlots } from 'vue';
import ServerError from './ServerError';

export default function useFetchState(loadOnUpdate: boolean) {
  const hasLoaded = ref(false);
  const error = ref({} as any);
  const state = ref('none' as 'none' | 'loading' | 'updating' | 'failed');

  const slots = useSlots();

  const isLoading = computed(
    () => state.value === 'loading' && (!hasLoaded.value || loadOnUpdate)
  );
  const isFailed = computed(() => state.value === 'failed');

  function handleError(e: any) {
    if (!slots.failed) {
      if (e.log) {
        e.log('FetchList unhandled:');
      } else {
        console.error('FetchList unhandled failed state: ' + e.message);
      }
    }
    state.value = 'failed';
    error.value = e instanceof ServerError ? e : e.message;
  }

  return { error, state, hasLoaded, isLoading, isFailed, handleError };
}

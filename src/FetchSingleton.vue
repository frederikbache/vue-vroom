<template>
  <slot name="loading" v-if="isLoading" />
  <slot name="failed" v-else-if="isFailed" :error="error" />
  <slot name="default" v-else v-bind="attrs" />
</template>

<script lang="ts" setup>
import { inject, computed, ref } from 'vue';

const props = defineProps({
  model: { type: String, required: true },
  loadOnUpdate: { type: Boolean, default: false },
});

// States
const state = ref('none' as 'none' | 'loading' | 'updating' | 'failed');
const hasLoaded = ref(false);
const isLoading = computed(
  () => state.value === 'loading' && (!hasLoaded.value || props.loadOnUpdate)
);
const isFailed = computed(() => state.value === 'failed');
const error = ref({} as any);

const store = (inject('stores') as any)[props.model]();

function fetch() {
  state.value = 'loading';

  store
    .$fetch()
    .then((res: any) => {
      hasLoaded.value = true;
      state.value = 'none';
    })
    .catch((e: any) => {
      error.value = e;
      state.value = 'failed';
    });
}

const item = computed(() => {
  return store.item;
});

const attrs = computed(() => {
  return {
    [props.model]: item.value,
  };
});

fetch();
</script>

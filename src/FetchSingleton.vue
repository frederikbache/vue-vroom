<template>
  <slot
    v-if="slots.all"
    v-bind="{ ...attrs, isLoading, isFailed, error }"
  ></slot>
  <slot name="loading" v-else-if="isLoading" />
  <slot name="failed" v-else-if="isFailed" :error="error" />
  <slot name="default" v-else v-bind="attrs" />
</template>

<script lang="ts" setup>
import { inject, computed, ref, useSlots } from 'vue';

const props = defineProps({
  model: { type: String, required: true },
  filter: { type: Object, default: () => ({}) },
  loadOnUpdate: { type: Boolean, default: false },
  path: { type: String, default: null },
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
const slots = useSlots();

function fetch() {
  state.value = 'loading';

  store
    .$fetch(props.filter, props.path)
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

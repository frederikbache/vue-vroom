<template>
  <slot
    v-if="slots.all"
    v-bind="{ ...attrs, isLoading, isFailed, error }"
    name="all"
  ></slot>
  <slot name="loading" v-else-if="isLoading" />
  <slot name="failed" v-else-if="isFailed" :error="error" />
  <slot name="default" v-else v-bind="attrs" />
</template>

<script lang="ts" setup>
import { inject, computed, useSlots } from 'vue';
import useFetchState from './useFetchState';

const props = defineProps({
  model: { type: String, required: true },
  filter: { type: Object, default: () => ({}) },
  loadOnUpdate: { type: Boolean, default: false },
  path: { type: String, default: null },
});

const store = (inject('stores') as any)[props.model]();
const slots = useSlots();

const { error, state, hasLoaded, isLoading, isFailed, handleError } =
  useFetchState(props.loadOnUpdate);

function fetch() {
  state.value = 'loading';

  store
    .$fetch(props.filter, props.path)
    .then((res: any) => {
      hasLoaded.value = true;
      state.value = 'none';
    })
    .catch(handleError);
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

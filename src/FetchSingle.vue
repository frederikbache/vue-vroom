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
import { watch, inject, computed, ref, onUnmounted, useSlots } from 'vue';
import useFetchState from './useFetchState';

type ID = number | string;

const props = defineProps({
  model: { type: String, required: true },
  id: { type: [Number, String], required: true },
  lazy: { type: Boolean, default: false },
  include: { type: Array as () => string[], default: () => [] },
  loadOnUpdate: { type: Boolean, default: false },
  path: { type: String, default: null },
  modelValue: { type: Object, default: undefined },
});

const includeIds = ref({} as any);

const stores = inject('stores') as any;
const store = stores[props.model]();
const settings = (inject('models') as any)[props.model];
const relations = computed(() => ({
  ...settings.hasMany,
  ...settings.belongsTo,
}));

const emit = defineEmits(['loaded', 'update:modelValue']);

// States
const slots = useSlots();

const { error, state, hasLoaded, isLoading, isFailed, handleError } =
  useFetchState(props.loadOnUpdate);

function fetch() {
  state.value = 'loading';
  store
    .$single(props.id, props.include, props.path)
    .then((res: any) => {
      hasLoaded.value = true;
      state.value = 'none';

      const newIncludeIds = {} as any;
      if (res.included) {
        Object.keys(res.included).forEach((name) => {
          newIncludeIds[name] = res.included[name].map((m: any) => m.id);
        });
      }
      includeIds.value = newIncludeIds;
    })
    .catch(handleError);
}

const item = computed(() => {
  const item = { ...store.single(props.id) };
  props.include.forEach((rel: string) => {
    const hasMany = rel in settings.hasMany;
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

const attrs = computed(() => {
  return {
    [props.model]: item.value,
  };
});

const cache = (inject('cache') as any)();
function updateSubscription(newId: ID, oldId: ID) {
  cache.subscribe(props.model, [newId]);
  cache.unsubscribe(props.model, [oldId]);
}

if (!props.lazy) fetch();
cache.subscribe(props.model, [props.id]);
watch(
  () => props.id,
  (newId, oldId) => {
    updateSubscription(newId, oldId);
    if (!props.lazy) fetch();
  }
);

watch(includeIds, (newIds, oldIds) => {
  Object.keys(newIds).forEach((model) => {
    cache.subscribe(model, newIds[model]);
  });
  Object.keys(oldIds).forEach((model) => {
    cache.unsubscribe(model, oldIds[model]);
  });
});

watch(state, (newVal, oldVal) => {
  if (oldVal === 'loading' && newVal === 'none') {
    emit('loaded', item.value);
  }
});

watch(item, (newVal) => {
  if (props.modelValue !== undefined) {
    emit('update:modelValue', newVal);
  }
});

// TODO Test that this works
onUnmounted(() => {
  cache.unsubscribe(props.model, [props.id]);
  Object.keys(includeIds.value).forEach((model) => {
    cache.unsubscribe(model, includeIds.value[model]);
  });
});
</script>

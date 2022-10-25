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
import { watch, inject, computed, ref, onUnmounted, useSlots } from 'vue';

type ID = number | string;

const props = defineProps({
  model: { type: String, required: true },
  id: { type: [Number, String], required: true },
  lazy: { type: Boolean, default: false },
  include: { type: Array as () => string[], default: () => [] },
  loadOnUpdate: { type: Boolean, default: false },
  path: { type: String, default: null },
});

const includeIds = ref({} as any);

const stores = inject('stores') as any;
const store = stores[props.model]();
const settings = (inject('models') as any)[props.model];
const relations = computed(() => ({
  ...settings.hasMany,
  ...settings.belongsTo,
}));

// States
const state = ref('none' as 'none' | 'loading' | 'updating' | 'failed');
const hasLoaded = ref(false);
const isLoading = computed(
  () => state.value === 'loading' && (!hasLoaded.value || props.loadOnUpdate)
);
const isFailed = computed(() => state.value === 'failed');
const error = ref({} as any);
const slots = useSlots();

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
    .catch((e: any) => {
      error.value = e;
      state.value = 'failed';
    });
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

// TODO Test that this works
onUnmounted(() => {
  cache.unsubscribe(props.model, [props.id]);
  Object.keys(includeIds.value).forEach((model) => {
    cache.unsubscribe(model, includeIds.value[model]);
  });
});
</script>

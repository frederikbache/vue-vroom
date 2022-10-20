<template>
  <slot name="loading" v-if="isLoading" />
  <slot name="failed" v-else-if="isFailed" :error="error" />
  <slot name="default" v-else v-bind="attrs" />
</template>

<script lang="ts" setup>
import { computed, inject, onUnmounted, ref, watch } from 'vue';

type SortSettings = {
  field: string;
  dir?: 'ASC' | 'DESC';
};

type PaginationSettings = {
  page?: number;
  limit?: number;
  cursor?: number | string;
};

const props = defineProps({
  model: { type: String, required: true },
  include: { type: Array as () => string[], default: () => [] },
  pagination: { type: Object as () => PaginationSettings, default: () => ({}) },
  filter: { type: Object, default: () => ({}) },
  sort: { type: Array as () => SortSettings[], default: () => [] },
  mergePages: { type: Boolean, default: false },
  loadOnUpdate: { type: Boolean, default: false },
});

const emit = defineEmits(['ready']);

const store = (inject('stores') as any)[props.model]();
const cache = (inject('cache') as any)();
const settings = (inject('models') as any)[props.model];

const hasLoaded = ref(false);

const relations = computed(() => ({
  ...settings.hasMany,
  ...settings.belongsTo,
}));
const filterString = computed(
  () =>
    JSON.stringify(props.filter) +
    '|' +
    JSON.stringify(props.pagination) +
    '|' +
    JSON.stringify(props.sort)
);

// States
const state = ref('none' as 'none' | 'loading' | 'updating' | 'failed');
const isLoading = computed(
  () => state.value === 'loading' && (!hasLoaded.value || props.loadOnUpdate)
);
const isFailed = computed(() => state.value === 'failed');
const error = ref({} as any);

const ids = ref([] as any[]);
const includeIds = ref({} as any);
const meta = ref({} as any);

const items = computed(() => {
  let all = store
    .list(ids.value)
    .sort(
      (a: any, b: any) => ids.value.indexOf(a.id) - ids.value.indexOf(b.id)
    );
  props.include.forEach((rel: string) => {
    const hasMany = rel in settings.hasMany;
    const relStore = (inject('stores') as any)[relations.value[rel]()]();
    all = all.map((item: any) => {
      const newItem = { ...item };
      if (hasMany) {
        newItem[rel] = relStore.items.filter((relItem: any) =>
          item[rel + 'Ids'].includes(relItem.id)
        );
      } else {
        newItem[rel] = relStore.items.find(
          (relItem: any) => item[rel + 'Id'] === relItem.id
        );
      }
      return newItem;
    });
  });
  return all;
});

function create(data: any) {
  store.create(data).then((item: any) => {
    ids.value = [...ids.value, item.id];
  });
}

function pushId(id: any) {
  ids.value = [...ids.value, id];
}

const attrs = computed(() => {
  return {
    [props.model + 'Items']: items.value,
    meta: {
      ...meta.value,
      refresh: fetch,
      pushId,
      create,
    },
  };
});

function fetch() {
  state.value = 'loading';
  store
    .$list(props.filter, props.pagination, props.sort, props.include)
    .then((res: any) => {
      const resIds = res.items.map((item: any) => item.id);
      ids.value = props.mergePages ? [...ids.value, ...resIds] : resIds;
      meta.value = res.meta;
      state.value = 'none';

      const newIncludeIds = {} as any;
      if (res.included) {
        Object.keys(res.included).forEach((name) => {
          newIncludeIds[name] = res.included[name].map((m: any) => m.id);
        });
      }
      includeIds.value = newIncludeIds;
      hasLoaded.value = true;
    })
    .catch((e: any) => {
      error.value = e;
      state.value = 'failed';
    });
}

fetch();
watch(filterString, () => {
  fetch();
});
watch(ids, (newIds, oldIds) => {
  // TODO swap method instead?
  cache.subscribe(props.model, newIds);
  cache.unsubscribe(props.model, oldIds);
});

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
  cache.unsubscribe(props.model, ids.value);
  Object.keys(includeIds.value).forEach((model) => {
    cache.unsubscribe(model, includeIds.value[model]);
  });
});

emit('ready', {
  refresh: fetch,
  pushId,
  create,
});
</script>

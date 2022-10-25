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
import { computed, inject, onUnmounted, ref, useSlots, watch } from 'vue';

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

const stores = inject('stores') as any;
const store = stores[props.model]();
const cache = (inject('cache') as any)();
const settings = (inject('models') as any)[props.model];
const slots = useSlots();

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
const meta = ref({} as any);

const itemMap = computed(() => {
  let all = store
    .list(ids.value)
    .sort(
      (a: any, b: any) => ids.value.indexOf(a.id) - ids.value.indexOf(b.id)
    );
  const includes = {} as any;
  props.include.forEach((rel: string) => {
    const hasMany = rel in settings.hasMany;
    const relModel = relations.value[rel]();
    const relStore = stores[relModel]();
    if (!includes[relModel]) includes[relModel] = [];
    all = all.map((item: any) => {
      const newItem = { ...item };
      if (hasMany) {
        includes[relModel].push(...item[`${rel}Ids`]);
        newItem[rel] = relStore.list(item[`${rel}Ids`]);
      } else {
        includes[relModel].push(item[`${rel}Id`]);
        newItem[rel] = relStore.single(item[`${rel}Id`]);
      }
      return newItem;
    });
  });
  return { items: all, includes };
});

const items = computed(() => {
  return itemMap.value.items;
});

const includeIds = computed(() => {
  return itemMap.value.includes;
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

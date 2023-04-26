<template>
  <slot
    v-if="slots.all"
    v-bind="{ ...attrs, isLoading, isFailed, error }"
    name="all"
  />
  <slot name="loading" v-else-if="isLoading" />
  <slot name="failed" v-else-if="isFailed" :error="error" />
  <slot name="default" v-else v-bind="attrs" />
</template>

<script lang="ts" setup>
import { computed, inject, onUnmounted, ref, useSlots, watch } from 'vue';
import useFetchState from './useFetchState';

import type Sockets from './sockets';

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
  path: { type: String, default: null },
  modelValue: { type: Array, default: null },
});

const emit = defineEmits(['ready', 'loaded', 'update:modelValue']);

const stores = inject('stores') as any;
const socket = inject('socket') as Sockets<any>;
const store = stores[props.model]();
const cache = (inject('cache') as any)();
const settings = (inject('models') as any)[props.model];
const slots = useSlots();

const socketId = ref('#' + Math.random());

/* const sub = socket.subscribeToModel(props.model, props.filter);
sub.on('db:create', (data) => {
  store.add([data]);
  pushId(data.id);
});
sub.on('db:update', (data) => {
  store.add([data]);
});
sub.on('db:delete', (data) => {
  store.localDelete(data.id);
}); */

/* socketId.value = socket.subscribeToModel(props.model, props.filter, (event) => {
  if (event.type === 'db:create') {
    store.add([event.data]);
    pushId(event.data.id);
  } else if (event.type === 'db:update') {
    store.add([event.data]);
  } else if (event.type === 'db:delete') {
    store.localDelete(event.data.id);
  }
  console.log('Subscription gave event', event);
}); */
/* if (socket.readyState === 1) {
  socket.send(
    JSON.stringify({
      id: socketId.value,
      subscribe: props.model,
      filter: props.filter,
      events: ['db:create', 'db:update', 'db:delete'],
    })
  );
} else {
  socket.addEventListener('open', () => {
    socket.send(
      JSON.stringify({
        id: socketId.value,
        subscribe: props.model,
        filter: props.filter,
        events: ['db:create', 'db:update', 'db:delete'],
      })
    );
  });
} */

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

const { error, state, hasLoaded, isLoading, isFailed, handleError } =
  useFetchState(props.loadOnUpdate);

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
    .$list(
      props.filter,
      props.pagination,
      props.sort,
      props.include,
      props.path
    )
    .then((res: any) => {
      const resIds = res.items.map((item: any) => item.id);
      ids.value = props.mergePages ? [...ids.value, ...resIds] : resIds;
      meta.value = res.meta;
      state.value = 'none';
      hasLoaded.value = true;
    })
    .catch(handleError);
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

function handleSocketEvent(event: any) {
  if (event.type === 'db:create' && event.subIds.includes(socketId.value)) {
    pushId(event.id);
  }
}

// socket.addEventListener('message', handleSocketEvent);

onUnmounted(() => {
  cache.unsubscribe(props.model, ids.value);
  Object.keys(includeIds.value).forEach((model) => {
    cache.unsubscribe(model, includeIds.value[model]);
  });

  // sub.unsubscribe();
});

emit('ready', {
  refresh: fetch,
  pushId,
  create,
});

watch(state, (newVal, oldVal) => {
  if (oldVal === 'loading' && newVal === 'none') {
    emit('loaded', items.value);
  }
});

watch(items, (newVal) => {
  if (props.modelValue) {
    emit('update:modelValue', newVal);
  }
});
</script>

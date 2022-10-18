# FetchList

The most typical way to interact with your api in Vroom is to fetch and show
lists of content. For that use the `FetchList` component. It supports

- Sorting
- Pagination
- Filtering
- Including relations

See the next few pages for details on how these work

```vue
<template>
    <FetchList
        model="book"
        :include=['author', 'genre']
        :pagination="{ page: 1, limit: 10 }"
        :filter={ genreId: '1' }
    >
        <template #default="{ bookItems, meta }">
            
        </template>
    </FetchList>
</template>
```

## Slots

The component has three slots

- `default` will be shown when the item is successfully loaded. It will receive
  two `slotProps`
  - `[model]Items`: the items received from the api
  - `meta` information regarding pagination + some helpful functions
- `loading` shown while loading (the first time)
- `failed` shown when the request failed

If you add the `load-on-update` attribute, the loading slot will be shown every
time the component refetches

::: tip

Note that a FetchList is always locked to the ids it received from the api. That
means that the list will not automatically update if you create a new item in a
relation (e.g. using `vroom.db.book.create()`). To get the list to update you
can use one of the methods supplied by `meta`

:::

## Meta

The meta object contains some data and some helpful methods

**Pagination**

- `nextCursor` - when using cursor based pagination, this will supply the id of
  the next item (if any)
- `page` - when using page based pagination, this will supply the current page
- `pages` - when using page based pagination, this will supply the total amount
  of pages
- `results` - when using page based pagination, this will supply the total
  amount of results

**Methods**

- `refresh` - calling this will make the list refetch using current settings
- `pushId` - takes an id and pushes it to the list (does not trigger refetch)
- `create` - takes some data, creates a new item, and pushes the id (does not
  trigger refetch)

## Getting meta from ready event

You always have access to meta within the default slot, but you can also access
it from the `ready` event on the list (e.g. if you want to save it into a ref
for later use)

```vue
<template>
    <FetchList
        model="book"
        :include=['author', 'genre']
        :pagination="{ page: 1, limit: 10 }"
        :filter={ genreId: '1' }
        @ready="meta => refresh = meta.refresh"
    >
        <template #default="{ bookItems, meta }">
            
        </template>
    </FetchList>

    <button @click="refreshList">Refresh</button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const refresh = ref(null as Function | null)

function refreshList() {
    if (refresh.value) {
        refresh.value();
    }
}
</script>
```

## Updates and subscriptions

The component will subscribe to the ids of the items it receives, making sure
they will be kept in the store until the component is unmounted.

The component will trigger a fetch if the sort, pagination, filters or includes
changes (and will update its subscriptions)

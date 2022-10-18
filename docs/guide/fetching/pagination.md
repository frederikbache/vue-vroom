# Paginating lists

FetchList let's you easily interact with models with pagination. Remember to
[add pagination to your model](guide/models/pagination) first.

## Page pagination

To get a page of book model with page pagination enabled:

```vue
<template>
    <FetchList 
        model="book" 
        :pagination="{ page: 1, limit: 10 }"
    >
        
    </FetchList>
</template>
```

## Cursor pagination

For cursor based pagination you can use the nextCursor provided by meta. Here we
also utilize a FetchList props called `merge-pages` that will append items when
changing page instead of substituting them (useful for infinite lists like
messages)

```vue
<template>
  <FetchList
    model='message'
    :pagination="{ cursor }"
    merge-pages
  >
    <template #default="{ messageItems, meta }">
      <ul>
        <li v-for="message in messageItems">
          {{ message.content }}
        </li>
      </ul>

      <button
        v-if="meta.nextCursor"
        @click="cursor = meta.nextCursor"
      >
        Load more
      </button>
    </template>
  </FetchList>
</template>

<script setup>
import { ref } from 'vue';

const cursor = ref('');
</script>
```

## An example

The following example shows a list of items with prev and next buttons, that are
hidden when changing page would lead to errors

```vue
<template>
    <FetchList 
        model="book" 
        :pagination="{ page, limit: 10 }"
    >
        <template #default="{ bookItems, meta }">
            <ul>
                <li v-for="book in bookItems">
                    {{ book.title }}
                </li>
            </ul>

            <button 
                v-if="meta.page > 1" 
                @click="page = page - 1"
            >
                Prev page
            </button>
            <button 
                v-if="meta.page < meta.pages" 
                @click="page = page + 1"
            >
                Next page
            </button>
        </template>
        
    </FetchList>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const page = ref(1);
</script>
```

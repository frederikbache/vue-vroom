# Paginating lists


```vue
<template>
    <FetchList 
        model="monsters" 
        :pagination="{ page: 1, limit: 10 }"
    >
        ...
    </FetchList>
</template>
```

## Cursor pagination
```vue
<template>
  <FetchList
    model='messages'
    :pagination="{ cursor }"
    merge-pages
  >
    <template #default="{ messages, meta }">
      <ul>
        <li v-for="message in messages">
          {{ message.content }}
        </li>
      </ul>

      <button
        v-if="meta.nextCursor"
        @click="meta.loadMore()"
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
The following example shows a list of items with prev and next buttons, that are hidden when changing page would lead to errors
```vue
<template>
    <FetchList 
        model="monsters" 
        :pagination="{ page, limit: 10 }"
    >
        <template #default="{ monsters, meta }">
            <ul>
                <li v-for="monster in monsters">
                    {{ monster.name }}
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
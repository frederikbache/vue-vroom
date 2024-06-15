# Including relations
To include relations, pass an array to `useList`
```vue
<template>
    <ul>
        <li v-for="book in items" :key="book.id">
            {{ book.title }} by {{ book.author?.name }} - {{ book.reviews ? book.reviews.length : 0 }} reviews
        </li>
    </ul>
</template>
<script setup lang="ts">
import vroom from '@/vroom';

// This will call /books?include=author,reviews
const { items } = vroom.useList('book', {
    include: ['author', 'reviews']
});
</script>
```

Note: vroom will save the included items in the corresponding stores but nest them in the returned items.
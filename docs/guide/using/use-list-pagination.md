# Paginating lists
To paginate your list pass a pagination object
```vue
<script setup lang="ts">
import vroom from '@/vroom';

// This will call /books?page=2&limit=10
const { items } = vroom.useList('book', {
    pagination: { page: 2, limit: 10 }
});
</script>
```

## Using reactive props
You can use reactive props to make `useList` refetch when pagination changes like so

```vue
<script setup lang="ts">
import vroom from '@/vroom';

const page = ref(1);

const { items } = vroom.useList('book', {
    pagination: { page }
});

function goToPage(newPage: number) {
    page.value = newPage; // This will trigger a refetch
}
</script>
```
# Sorting lists
To sort lists pass an array of fields to sort on, and the direction use.
```vue
<script setup lang="ts">
import vroom from '@/vroom';

// This will call /books?sort=-name,age
const { items } = vroom.useList('book', {
    sort: [{ field: 'name', dir: 'DESC' }, { field: 'age', dir: 'ASC' }]
});
</script>
```

## Using reactive props
You can use reactive props to make `useList` refetch when sorting changes like so

```vue
<script setup lang="ts">
import vroom from '@/vroom';

const sortDir = ref('DESC' as 'ASC' | 'DESC');
const sortField = ref('name');

const { items } = vroom.useList('book', {
    sort: [{ field: sortField, dir: sortDir }]
});

// The whole sort can also be reactive
const sortAsComputed = computed(() => ([{ field: sortField, dir: sortDir }]));
const { items: list2 } = vroom.useList('book', {
    sort: sortAsComputed
});

function setSortField(field: string) {
    sortField.value = field; // This will trigger a refetch
}
</script>
```
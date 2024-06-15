# Filter lists
To filter your list pass an object of field and filter values
```vue
<script setup lang="ts">
import vroom from '@/vroom';

// This will call /books?authorId=2
const { items } = vroom.useList('book', {
    filter: { authorId: 2 }
});
</script>
```

## Other filter operators

Vroom supports a few different filter operators

### Greater or less than

```typescript
// Get items with year <1950 (?year[lt]=1950)
{
  year: {
    lt:
    1950;
  }
}

// Get items with year <=1950 (?year[lte]=1950)
{
  year: {
    lte:
    1950;
  }
}

// Get items with year >1950 (?year[gt]=1950)
{
  year: {
    gt:
    1950;
  }
}

// Get items with year >=1950 (?year[gte]=1950)
{
  year: {
    gte:
    1950;
  }
}
```

### Between

```typescript
// Get items with years between 1950 and 2000 (?year[between]=1950,2000)
{
  year: {
    between:
    [1950, 2000];
  }
}
```

### Contains

```typescript
// Get items where title contains 'the' (?title[contains]=the)
{
  title: {
    contains:
    "the";
  }
}
```

## Custom filters

You can also apply any of your [custom filters](/guide/server/filters) here.

## Using reactive props
You can use reactive props to make `useList` refetch when filters. For example:

```vue
<script setup lang="ts">
import vroom from '@/vroom';

const search = ref('');

const { items } = vroom.useList('book', {
    filter: { title: { contains: search }}
});
</script>
```
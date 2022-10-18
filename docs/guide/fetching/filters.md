# Filtering lists

To filter a list, use the `filter` prop and pass it an object of filters

```vue
<template>
    <FetchList 
        model="book" 
        :filter="{ genreId: '1', pageCount: { gte: 1000 } }"
    >
        <template #default="{ bookItems }">
            <h2>Long books in genre 1</h2>
            <ul>
                <li v-for="book in bookItems">
                    {{ book.name }}
                </li>
            </ul>
        </template>
        
    </FetchList>
</template>
```

## Filter operators

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

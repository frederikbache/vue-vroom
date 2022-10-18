# Sorting lists

To sort a list, use the `sort` prop and pass it an array of objects

```vue
<template>
    <FetchList 
        model="book" 
        :sort="[{ field: 'title', dir: 'ASC' }]"
    >
        <template #default="{ bookItems }">
            <ul>
                <li v-for="book in bookItems">
                    {{ book.title }}
                </li>
            </ul>
        </template>
        
    </FetchList>
</template>
```

This will append a comma separated sort query param om the API call. Each
descending sort field will be prefixed with `-` (e.g.
`/books/?sort=title,-year`):

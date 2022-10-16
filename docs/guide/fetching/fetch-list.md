# FetchList
```vue
<template>
    <FetchList
        model="book"
        :include=['author', 'genre']
        :pagination="{ page: 1, limit: 10 }"
        :filter={ genreId: '1' }
    >
        <template #default="{ bookItems }">
        </template>
    </FetchList>
</template>
```
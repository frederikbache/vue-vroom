# Including relations

```vue
<template>
    <FetchList model="book" :include="['author']">
        <template #default="{ bookItems }">
            <ul>
                <li v-for="book in bookItems" :key="book.id">
                    {{ book.title }} - {{ book.author?.name }}
                </li>
            </ul>
        </template>
    </FetchList>

    <FetchSingle model="author" id="1" :include="['books']">
        <template #default="{ author }">
            <p>{{ author.name }}</p>
                <li v-for="book in author.books" :key="book.id">
                    {{ book.title }}
                </li>
            </ul>
        </template>
    </FetchSingle>
</template>
```
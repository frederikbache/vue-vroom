# Including relations

Both `FetchSingle` and `FetchList` supports including your
[models relations](/guide/models/relations).

A few things happen when you do this:

- The api will be called with an include param, e.g. `/books?include=author`
- The mock api will reply with the authors sideloaded
- The books and authors are put into their respective stores
- The component nests the included resource in the slot scope for easier access

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

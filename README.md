# Vroom

Vroom is a store and api mock generator for Vue.js and pinia, that lets you
build applications fast and even before backend is ready.

See the [full documentation here](https://frederikbache.github.io/vue-vroom/).

# Getting started

To get started setup of a Vue 3 project with Pinia, e.g. using
[create-vue](https://github.com/vuejs/create-vue). In this guide we will

1. Install Vroom package
2. Setup config
3. Setup global component types (for TS projects)
4. Install Vroom in our app
5. Fetch some data and show it
6. Use store actions to manipulate data

## Peer dependencies and browser support

Vroom is built to work with [Pinia](https://pinia.vuejs.org/) and Vue 3. Vroom
is targeted at modern browsers and uses the
[Fetch API](https://caniuse.com/fetch) instead of XMLHttpRequest.

Peer dependencies:

- Vue `^3.0.0`
- Pinia `^2.0.0`

_Note: Vroom is still in alpha, so breaking changes might be introduced between
each minor release._

# 1. Install package

To install Vroom

```sh
npm i vue-vroom
```

# 2. Add config file

Create a `vroom/index.ts` file to store your configuration. This is a basic
example that:

- Adds two models, `book` and `author` and sets up a relation between them
  ([Read more about models](https://frederikbache.github.io/vue-vroom/guide/models/))
- Enables the mock server and db
  ([Read more about server](https://frederikbache.github.io/vue-vroom/guide/server/))
- Seeds some test data into the mock db
  ([Read more about seeding](https://frederikbache.github.io/vue-vroom/guide/server/seeding.html))
- Exports the autogenerated types for later use

```typescript
// src/vroom/index.ts
import { createVroom, defineModel } from "vue-vroom";

const vroom = createVroom({
  models: {
    book: defineModel({
      schema: {
        title: { type: String },
        isFavourite: { type: Boolean },
      },
      belongsTo: {
        author: () => "author",
      },
    }),
    author: defineModel({
      schema: {
        name: { type: String },
      },
      hasMany: {
        books: () => "book",
      },
    }),
  },
  server: {
    enable: true,
  },
});

vroom.db.author.createMany(
  {
    name: "George R.R. Martin",
    books: vroom.db.book.createMany(
      { title: "A Game of Thrones" },
      { title: "A Clash of Kings" },
    ),
  },
  {
    name: "JRR Tolkien",
    books: vroom.db.book.createMany(
      { title: "The Hobbit" },
      { title: "The Lord of the rings" },
    ),
  },
);

export type Models = typeof vroom.types;

export default vroom;
```

_It is recommended to split up models, config and seeds for better organisation
and bundle optimization.
[See notes on organisation here](https://frederikbache.github.io/vue-vroom/guide/intro/organization.html)_

# 3. Add global component declarations

Vroom adds some global components. To get proper type hints on these add a
`components.d.ts` file to your `/src` folder.

```typescript
// src/components.d.ts
import type {
  FetchListComponent,
  FetchSingleComponent,
  FetchSingletonComponent,
} from "vue-vroom";
import type vroom from "@/vroom";

declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    FetchList: FetchListComponent<typeof vroom>;
    FetchSingle: FetchSingleComponent<typeof vroom>;
    FetchSingleton: FetchSingletonComponent<typeof vroom>;
  }
}
```

# 4. Install on Vue app

Then import your vroom instance in `main.ts` file along with your pinia
installation and install it

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import vroom from "./vroom";
import App from "./App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(vroom);
app.mount("#app");
```

# 5. Fetch and show data

Find a place you want to show some data e.g. `App.vue` and add the following

```vue
<template>
    <FetchList 
        model="book" 
        :sort="[{ field: 'title', dir: 'ASC' }]"
        :include="['author']"
    >
        <template #loading>Loading books...</template>

        <template #default="{bookItems}">
            <p v-for="book in bookItems" :key="book.id">
                {{ book.title }} was written by {{ book.author.name }}
            </p>
        </template>
    </FetchList>
</template>

<script lang="ts" setup></script>
```

- The `FetchList` component will in this example trigger a call to
  `/books?sort=title,include=author`
- It will pass the results into the default slot, when it's done loading
- It will keeps its results cached until it's unmounted (see more about cache)

There are three different components for fetching data

- FetchList
- FetchSingle
- FetchSingleton

# 6. Manipulate data

Let's update the example above to be able to favourite a book

```vue
<template>
    <FetchList 
        model="book" 
        :sort="[{ field: 'title', dir: 'ASC' }]"
        :include="['author']"
    >
        <template #loading>Loading books...</template>

        <template #default="{bookItems}">
            <p v-for="book in bookItems" :key="book.id">
                {{ book.title }} was written by {{ book.author.name }}

                <button @click="toggleFavorite(book)">
                    {{ book.isFavourite ? 'Unfavourite' : 'Favourite' }}
                </button>
            </p>
        </template>
    </FetchList>
</template>

<script lang="ts" setup>
import vroom, { type Models } from '@/vroom';

const bookStore = vroom.stores.book();

function toggleFavourite(book: Models['book']) {
    bookStore.update(book.id, {
        isFavourite: !book.isFavourite
    })
}
</script>
```

This example uses the autogenerated store (all accessible on `vroom.stores`).
Calling update will trigger a called to `PATCH /books/:id` along with data
passed as the second argument

# Contributing

Contributions are most welcome 🙌

To contribute:

- Fork this repository
- Create a branch from `main` with your feature (and try to keep it small)
- Send a pull request from your branch to the `main` branch.

# License

[MIT](https://opensource.org/licenses/MIT)

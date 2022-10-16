# Getting started
To get started setup of a Vue project with Pinia, e.g. using [create-vue](https://github.com/vuejs/create-vue)

Requirements:
- Vue `^3.0.0`
- Pinia `^2.0.0`

## Install package
To install Vroom
```sh
npm i vue-vroom
# or
yarn add vue-vroom
```

## Add config file
Create a `vroom/index.ts` file to store your configuration. This is a very basic example that:
- Adds a single model called todo
- Enables the server

```typescript
// src/vroom/index.ts
import { createVroom, defineModel } from 'vue-vroom';

const vroom = createVroom({
    models: {
        todo: defineModel({
            schema: {
                title: { type: String },
                completed: { type: Boolean }
            }
        })
    },
    server: {
        enable: true
    }
})

export default vroom;
```

## Add your config to main.ts
Then import your vroom instance in `main.ts` file along with your pinia installation and install it

```typescript{3,8,10}
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import vroom from './vroom';
import App from './App.vue';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(vroom);
app.mount('#app');
```

## Typescript: Add types for global components
Vroom adds some global components. To get proper type hints on these add a `components.d.ts` file to your `/src` folder.
TODO Links to a page here?

```typescript
import type { 
    FetchListComponent, 
    FetchSingleComponent, 
    FetchSingletonComponent 
} from 'vue-vroom'
import type vroom from '@/vroom'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    FetchList: FetchListComponent<typeof vroom>,
    FetchSingle: FetchSingleComponent<typeof vroom>,
    FetchSingleton: FetchSingletonComponent<typeof vroom>
  }
}
```

## Typescript: Export types
Vroom will give you type hints everywhere it can, but sometimes you might need access to the generated types somewhere.
Therefore it is recommended to export your types from the vroom config file like so:

```typescript{7,8}
import { createVroom, defineModel } from 'vue-vroom';

const vroom = createVroom({
    ...
})

// You can call this type whatever you want
export type Models = typeof vroom.types;

export default vroom;
```

You can now use it for example to type hint props in a component

```vue
<script setup lang="ts">
import { Models } from '@/vroom';

defineProps({
    todo: { type: Object as () => Models['todo'], required: true}
})
</script>
```
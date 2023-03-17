# Organisation and optimization

Even small projects can quickly get many models, seeds and custom routes. Here's
a few ideas for organizing your code to keep it easy to read and to make sure
that development code like seeds, filters and routes are not bundled into your
production build.

## An example dir structure

A way to structure you vroom dir could be

- `vroom/models/index.ts` returns all your model definitions
- `vroom/seeds/index.ts` returns a function that seeds the db
- `vroom/filters/index.ts` returns a function that add custom filters
- `vroom/sideeffects/index.ts` returns a function that add side effects
- `vroom/routes/index.ts` returns a function that add custom routes
- `vroom/setup.ts` loads your model and creates the vroom instance
- `vroom/index.ts` conditionally runds seed, filter and routes functions and
  exports the vroom instance

## An example with seeds

Setup models (could be split in even more files)

```typescript
// vroom/models/index.ts
import { defineModels } from "vue-vroom";
import models from "./models";

export default {
  todo: defineModel({
    schema: {
      title: { type: String },
      completed: { type: Boolean },
    },
  }),
};
```

Load the models and create the Vroom instance

```typescript
// vroom/setup.ts
import { createVroom } from 'vue-vroom'
import models from './models'

const vroom = createVroom({
    models,
    server: {
        enable: true,
    }
})

export vroom;
```

Use the vroom instance in the seed function to add mock data

```typescript
// vroom/seeds/index.ts
import vroom from "../setup";

export default function seed() {
  const { db } = vroom;

  db.todo.create({
    title: "Buy milk",
    completed: false,
  });
}
```

Only call the seed function in non production environments (should allow your
bundler to keep the seed function out of your bundle)

```typescript
// vroom/index.ts
import vroom from "./setup";
import seed from "./seed";

if (process.env.NODE_ENV !== "production") {
  seed();
}

export default vroom;
```

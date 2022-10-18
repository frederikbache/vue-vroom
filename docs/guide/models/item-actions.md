# Item actions

Sometimes CRUD is not enough. For those situations use `itemActions`

```typescript
const book = defineModel({
    schema: {
        title: { type: String },
        isFavourite: { type: Boolean }
    },
    itemActions: {
        toggle(item) {
            return { isFavourite: !item.isFavourite }
        }
    }
}):
```

Each item action will request an api route in the form `model/:id/action` so in
the example it would be `books/:id/toggle`.

The action will be added the model's store, that can be called with the id of
the item you wish to trigger the action for

```typescript
const bookStore = vroom.stores.bookStore();

bookStore.toggle("1");
// Will call /books/1/toggle
```

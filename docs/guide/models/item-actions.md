# Item actions
Sometimes CRUD is not enough. For those situations use `itemActions`

```typescript
const todo = defineModel({
    schema: {
        title: { type: String },
        completed: { type: Boolean }
    },
    itemActions: {
        toggle(item) {
            return { completed: !item.completed }
        }
    }
}):
```
Each item action will request an api route in the form `model/:id/action` so in the example it would be `todos/:id/toggle`.

The action will be added the model's store, that can be called with the id of the item you wish to trigger the action for

```typescript
const todoStore = vroom.stores.todo();

todoStore.toggle('1')
// Will call /todos/1/toggle
```
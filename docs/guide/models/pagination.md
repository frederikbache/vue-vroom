# Pagination settings

To enable pagination on a model use the `pagination` prop. It takes on object
with two props

- `type` - either `page` or `cursor`
- `defaultLimit` - the default amount of results to return

```typescript
const book = defineModel({
  schema: {
    title: { type: String },
  },
  pagination: {
    type: "page",
    defaultLimit: 10,
  },
});
```

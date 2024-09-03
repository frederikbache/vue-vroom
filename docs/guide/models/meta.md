# Meta fields for lists
For lists of items, you can also define a list of extra meta fields to send back along the default pagination fields.

The format is the same as for schema. Vroom will just send back the default type value ("", 0, false etc.) when mocking. But you can [overwrite the mock value](/guide/server/meta) if you want.

```typescript
const review = defineModel({
  schema: {
    rating: { type: Number },
    title: { type: String },
    message: { type: String }
  },
  listMeta: {
    avgRating: { type: Number },
  },
});
```
# Mocking meta fields
If your api sometimes sends extra meta information for a list as [defined in your model](/guide/models/meta), you can mock them in your server.

For example let's say you want to return the avgRating of all reviews along with your review list.

```typescript
vroom.server?.addMetaFields({
  review: {
    // Items will be all filtered items before pagination
    avgRating(items, db) {
      if (items.length === 0) return 0;
      return items.reduce((acc, item) => acc + item.rating, 0) / items.length;
    },
  },
});
```

::: tip

Make sure to include this in a way where your bundler can ignore it in
production. [See notes on organisation here](/guide/intro/organization).

:::
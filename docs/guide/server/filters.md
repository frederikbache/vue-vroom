# Adding custom filters

See [filtering lists](/guide/fetching/filters) for basic filters

```typescript
vroom.server.addFilters({
  book: {
    // Let's do a search that searches in title and author
    search(item, value, db) {
      const author = item.authorId ? db.author.find(item.authorId) : null;
      if (author && author.name.toLowerCase().includes(value.toLowerCase())) {
        return true;
      }
      return item.title.toLowerCase().includes(value.toLowerCase());
    },
  },
});
```

This will allow you to call `books?search=...`

::: tip

Make sure to include this in a way where your bundler can ignore it in
production. [See notes on organisation here](/guide/intro/organization).

:::

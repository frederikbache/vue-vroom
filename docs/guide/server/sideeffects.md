# Mocking side effects
Sometimes an endpoint will have a side effect, for instance deleting an item, might delete it's related items, or updating an item, will create a log somewhere.

To be able to mock this behaviour you can use side effects

```typescript
vroom.server.addSideEffects({
  author: {
    // Delete all of an author's book when an author is deleted
    delete(item, db) {
      const books = db.book.where((book) => book.authorId === item.id);
      books.forEach((book) => {
        db.book.destroy(book.id)
      })
    },
  },
  book: {
    // Update side effects also receive the patchData it was sent
    update(item, db, patchData) {
      db.log.create({ 
        message: `The book "${item.title}" was updated with the following data ${JSON.stringify(patchData)}` 
      });
    }
  }
});
```

## Manipulating the return value
For any endpoint that returns a response, you can also manipulate the response using the sideeffect

```typescript
vroom.server.addSideEffects({
  book: {
    // Add an updated at timestamp and return it as part of the endpoint response
    update(item, db) {
        return db.book.update(
            item.id, 
            { updatedAt: (new Date()).toISOString() }
        );
    },
  },
});
```

::: tip

Make sure to include this in a way where your bundler can ignore it in
production. [See notes on organisation here](/guide/intro/organization).

:::
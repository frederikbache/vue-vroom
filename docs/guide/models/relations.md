# Relations

```typescript
const models = {
    book: defineModel({
        schema: {
            title: { type: String }
        },
        belongsTo: {
            author: () => 'author'
        }
    }),
    author: defineModel({
        schema: {
            name: { type: String }
        },
        hasMany: {
            books: () => 'book'
        }
    })
}
```

## Setting the inverse
Sometimes a model relates to the same model multiple times. To help automate updates across the mock db,
you can specify the inverse relationship, like in the example below
```typescript
const models = {
    user: defineModel({
        schema: {
            name: { type: String }
        },
        hasMany: {
            outgoingMessages: () => 'message',
            ingoingMessages: () => 'message',
        },
        inverse: {
            outgoingMessages: 'sender',
            ingoingMessages: 'recipient',
        }
    }),
    message: defineModel({
        schema: {
            name: { type: String }
        },
        belongsTo: {
            sender: () => 'user',
            recipient: () => 'user',
        },
        inverse: {
            sender: 'outgoingMessages',
            recipient: 'ingoingMessages',
        }
    })
}
```
Setting `sender` on a message, will now only update the `user`s `outgoingMessages`
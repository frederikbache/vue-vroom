# Seeding data
You can add data to your mock server by accessing `vroom.db` on your created instance.

```typescript
const vroom = createVroom({
    models: {...},
    server: {
        enable: true,
    }
})

vroom.db.todo.create({
    title: 'Buy milk',
    completed: false
})
```

Each item you create in the db will automatically get an unique `id` based on you id settings.

## Seeding relations
Adding relationships is done by setting the id of one side of the relationsship. Vroom will automatically update the inverse relationship.

Given the following models

```typescript
const models = {
    book: defineModel({
        schema: {
            title: { type: String },
        },
        belongsTo: {
            author: () => 'author'
        }
    }),
    author: defineModel({
        schema: {
            name: { type: String },
        },
        hasMany: {
            books: () => 'book'
        }
    })
} 
```
We can create some relations like this
```typescript
const grrm = db.author.create({ name: 'George R. R. Martin'});
// Give the author
db.book.create({ title: 'A Game of Thrones', author: grrm })
// Or the id directly
db.book.create({ title: 'A Clash of Kings', authorId: grrm.id })

const hobbit = db.book.create({ title: 'The Hobbit' });
const lotr = db.book.create({ title: 'The Lord of the Rings' });

db.author.create({ name: 'J.R.R. Tolkien', books: [hobbit, lotr]})
```

You can also shortcut this process like so:
```typescript
db.author.create({
    name: 'George R. R. Martin',
    books: db.book.createMany(
        {title: 'A Game of Thrones'},
        {title: 'A Clash of Kings'}
    )
})
```

## Organisation and build optimization
To keep your project organised, you can split out your seeder in it's own file. One way to organise your setup could be like this:

```typescript
// vroom/setup.ts
const vroom = createVroom({
    models: {...},
    server: {
        enable: true,
    }
})

export vroom;
```

```typescript
// vroom/seeds.ts
import vroom from "./setup";

export default function seed() {
    const { db } = vroom;

    db.todo.create({
        title: 'Buy milk',
        completed: false
    })
}
```

In our index we can now make sure the seeder is only used in non-production envs
```typescript
// vroom/index.ts
import vroom from './setup';
import seed from './seed';

if (process.env.NODE_ENV !== 'production') {
    seed();
}

export default vroom;
```
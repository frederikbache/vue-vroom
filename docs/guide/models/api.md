# CRUD stores

Vroom will generate a store for each model you provide. They will all be saved
on `vroom.stores` and can be used for creating, updating and deleting items. For
fetching items use the built in components e.g.
[FetchList](/guide/fetching/fetch-list)

## Creating an item

```typescript
const bookStore = vroom.stores.book();

// This will call POST /books
const book = await bookStore.create({
  title: "The Hobbit",
});

console.log(book.id); // "1"
```

## Updating an item

```typescript
const bookStore = vroom.stores.book();

// This will call PATCH /books/1
const book = await bookStore.update("1", {
  title: "The Hobbit, or There And Back Again",
});

console.log(book.title); // "The Hobbit, or There And Back Again"
```

## Deleting an item

```typescript
const bookStore = vroom.stores.book();

// This will call DELETE /books/1
bookStore.delete("1");
```

## API naming

As default the key you give the model, when setting up vroom will define the api
routes

```typescript
const vroom = createVroom({
  models: {
    todo: defineModel({
      //...
    }),
  },
});
```

In this example `todo` will be used as the base for all api routes with naive
pluralising `+'s'`. Vroom will automatically callers for the following api
routes

| Method | Path       | Description       |
| ------ | ---------- | ----------------- |
| GET    | /todos     | List todos        |
| POST   | /todos     | Create a todo     |
| GET    | /todos/:id | Get a single todo |
| PATCH  | /todos/:id | Update a todo     |
| DELETE | /todos/:id | Delete a todo     |

## Setting plural name

By default Vroom will try to pluralise your model name by adding an `s`. You can
customise the plural name like so:

```typescript
const vroom = createVroom({
  models: {
    category: defineModel({
      plural: "categories",
    }),
  },
});
```

| Method | Path            | Description           |
| ------ | --------------- | --------------------- |
| GET    | /categories     | List categories       |
| POST   | /categories     | Create a category     |
| GET    | /categories/:id | Get a single category |
| PATCH  | /categories/:id | Update a category     |
| DELETE | /categories/:id | Delete a category     |

## Custom path

Overwrites the path of the base endpoint completely

```typescript
const vroom = createVroom({
  models: {
    todo: defineModel({
      path: "/v2/todos",
    }),
  },
});
```

| Method | Path          | Description       |
| ------ | ------------- | ----------------- |
| GET    | /v2/todos     | List todos        |
| POST   | /v2/todos     | Create a todo     |
| GET    | /v2/todos/:id | Get a single todo |
| PATCH  | /v2/todos/:id | Update a todo     |
| DELETE | /v2/todos/:id | Delete a todo     |

## Omitting actions

You might not always need or want all actions, so you can specify which actions
to create by providing an array of actions

```typescript
const vroom = createVroom({
  models: {
    todo: defineModel({
      //...
      only: ["index", "read"], // options: index, create, read, update, delete
    }),
  },
});
```

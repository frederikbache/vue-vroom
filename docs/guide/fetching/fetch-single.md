# Showing single models

To show a single item from a model, use the `FetchSingle` component.

```vue
<template>
    <FetchSingle model="book" id="1">
        <template #default="{book}">
            <h1>{{ book.title }}</h1>
        </template>
    </FetchSingle>
</template>
```

It takes two key props

- `model` the model to fetch
- `id` the id of the item to fetch

The component has three slots

- `default` will be shown when the item is successfully loaded with a single
  `slotProp` called the same as the models
- `loading` shown while loading (the first time)
- `failed` shown when the request failed

If you add the `load-on-update` attribute, the loading slot will be shown every
time the component refetches

## Updates and subscriptions

The component will subscribe to the id provided, making sure it will be kept in
the store until the component is unmounted.

The component will trigger a fetch if the id ever changes (and update its
subscriptions)

## Lazy singles

There might be cases where you know that the item you want to show has already
been loaded (e.g. when showing details for a list). For those cases you can use
the `lazy` prop.

When adding `lazy` the `FetchSingle` will behave exactly the same except it will
never trigger a call to your api

```vue
<template>
    <FetchSingle model="book" id="1" lazy>
        <template #default="{book}">
            <h1>{{ book.title }}</h1>
        </template>
    </FetchSingle>
</template>
```

# Config

## Base url
```typescript
createVroom({
    // ...
    baseURL: 'https://loremipsum.com/api',
    // ...
})
```

## Id settings
You can customise the type and content of the id's in your db. As default id's will be incremental numbers formatted as strings

### idsAreNumbers
If you set `idsAreNumbers` to `true` all id's in the database will become incremental integers

```typescript
createVroom({
    // ...
    idsAreNumbers: true,
    // ...
})
```

### idFactory
For string id's you can pass a function that generates a string

```typescript
createVroom({
    // ...
    idFactory(i: number) {
        return `#${i}`;
    },
    // ...
})
```
# Config

```typescript
createVroom({
    // An object of models (see model section)
    models: {...},
    // An object of server settings (see server section)
    server: {...},
    // Base url will be prepended to all automated calls (default '')
    baseURL: "https://mydomain.com/api",
    // Will make all ids in your mock db into incremental integers (default false)
    idsAreNumbers: false,
    // When using string ids, add this function to generate custom ids. Should return a unique string
    idFactory(i: number) {
        return `#${i}`;
    },
    // Pass this object if you want to overwrite how the list/single api returns
    naming: {
        // The key to use for returns of list of data (default: data)
        data: 'data',
        // The key to use for returns of single items (default: data)
        dataSingle: 'data',
        // The key to use for the included items (default: included)
        included: 'included',
        // The key to use for meta information (default: meta)
        meta: 'meta'
    }
});
```

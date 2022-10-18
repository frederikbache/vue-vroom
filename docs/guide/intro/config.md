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
});
```

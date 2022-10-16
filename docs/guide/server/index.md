# Setting up the mock server
::: tip
The server code will not be included in production bundles to keep your bundle lean and clean.
:::

```typescript
createVroom({
    server: {
        // Set to true to enable request intercepts and mock db
        enable: true | false,
        // The artificial delay of the mock server
        delay: 150,
    }
})
```
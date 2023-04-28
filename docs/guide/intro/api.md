# API config
Vroom creates an api helper for you which can be accessed on `vroom.api`.

## Global header
```typescript
// Setting global headers
vroom.api.headers["authorization"] = 'Bearer 123456'
```

## Error interceptor
```typescript
// Adding an error interceptor
vroom.api.intercept.error = (e) => {
    console.log('Intercepted error', e.status, e.data)
}
```
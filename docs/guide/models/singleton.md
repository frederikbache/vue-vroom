# Singleton models
For models that should have one item for each user (e.g. profile) use the the singleton model

```typescript
const profile = defineModel({
    schema: {
        name: { type: String },
        email: { type: String },
        bio: { type: String }
    },
    singleton: true // makes the model a singleton
})
```

This will generate a different set of api routes than a regular model

| Method | Path            | Description              |
|--------|-----------------|--------------------------|
| GET    | /profile        | Gets the profile         |
| PATCH  | /profile        | Updates the profile      |

Singleton routes also support setting a custom `path`.
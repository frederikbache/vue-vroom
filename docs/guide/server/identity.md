# Mocking identity
Sometimes it might be helpful to mock the identity connected to a auth token, if for instance we want to show a profile page

To do this you can use the `identityModel` prop on the configuration object

```typescript
createVroom({
    models: {
        user: defineModel({
            schema: {
                name: { type: String },
                email: { type: String }
            }
        })
    },
    identityModel: () => 'user',
    server: {
        enable: true
        delay: 150,
    },
})
```

When passed Vroom will try and find a matching user by looking at a passed `Bearer` token in the api headers, by using the token as the id of a user.

So if we did this

```typescript
vroom.db.user.createMany(
    { name: 'Alice', email: 'alice@alice.me' },
    { name: 'Bob', email: 'bob@bob.me' },
)

vroom.api.headers['authorization'] = 'Bearer 2';

vroom.server.get('/my-name', (request) => {
    // Will return {name: 'Bob'}
    return {
        name: request.identity?.name
    }
})
```

You could even add a mock auth route that returns a user's id as the token, to make this whole flow production ready

```typescript
type LoginInfo = {
  email?: string;
  password?: string;
};

vroom.server.post('/auth', (request, db) => {
    const { email, password } = request.json as LoginInfo;

    const matches = db.user.where(u => u.email === email);
    if (matches.length > 0 && password === 'secret') {
        return {
            token: matches[0].id
        }
    }

    throw new ServerError(422);
})
```

::: tip

Make sure to include this in a way where your bundler can ignore it in
production. [See notes on organisation here](/guide/intro/organization).

:::
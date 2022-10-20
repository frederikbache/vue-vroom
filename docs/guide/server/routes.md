# Custom routes

Besides the routes that Vroom autogenerates, you can also easily add custom
routes for mocking endpoints not directly related to your models (supports
`get`, `post`, `patch` and `delete`). For example you could mock a route that
logs in a user with a hardcoded test password

::: tip

Make sure to include this in a way where your bundler can ignore it in
production. [See notes on organisation here](/guide/intro/organization).

:::

```typescript
import { ServerError } from "vue-vroom";

type LoginInfo = {
  email?: string;
  password?: string;
};

vroom.server.post("/auth", (request, db) => {
  const { email, password } = request.json as LoginInfo;
  if (!email || !password) {
    throw new ServerError(400, { type: "missing_fields" });
  }

  if (password !== "verysecret") {
    throw new ServerError(400, { type: "wrong_credentials" });
  }

  return { token: "123456" };
});
```

You could now use it like so

```typescript
vroom.api.post("/auth", {
  email: "test@test.test",
  password: "verysecret",
}).then((res) => {
  vroom.api.headers["authorization"] = `Bearer ${res.token}`;
}).catch((e) => {
  // Handle error
});
```

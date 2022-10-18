# FetchSingleton

Works exactly like `FetchSingle` except you don't need to pass `id`.

```vue
<template>
    <FetchSingleton model="profile">
        <template #default="{ profile }">
            Name: {{ profile.name }}
        </template>
    </FetchSingleton>
</template>
```

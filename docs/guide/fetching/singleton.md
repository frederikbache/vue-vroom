# FetchSingleton

```vue
<template>
    <FetchSingleton model="profile">
        <template #default="{ profile }">
            Name: {{ profile.name }}
        </template>
    </FetchSingleton>
</template>
```
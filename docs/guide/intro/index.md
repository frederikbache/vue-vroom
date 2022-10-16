<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members = [
  {
    avatar: 'https://www.github.com/frederikbache.png',
    name: 'Frederik Bache',
    title: 'Freelance Frontend Engineer',
    links: [
      { icon: 'github', link: 'https://github.com/frederikbache' },
    ]
  },
]
</script>

# What is Vroom?
Vroom is a store an api mock generator for Vue.js and pinia, that let's you build applications fast and even before backend is ready.

## How does it work?
Vroom takes a set of model definitions and settings and does a few things:
- Creates a Pinia store for each model, with a set of standard CRUD actions (and let you add your own)
- Autogenerates requests to your api
- Let's you seed data into your models
- Creates an interceptor that captures the requests in development and responds with your data
- Supply you with simple components to load lists and single items

As Vroom autogenerates both the requests and the mock response you will need a certain degree of control over the design of the API you interact with to get any benefit from it. The purpose of the tool is not so much to adapt to existing api, but rather to discover and describe the needs for one, frontend first if you will.



## A very basic example
Please see [Getting Started](/guide/intro/getting-started) for a fuller breakdown

```typescript
const vroom = createVroom({
    models: {
        // Add a todo model with title and completed fields
        todo: defineModel({
            schema: {
                title: { type: String },
                completed: { type: Boolean }
            }
        })
    },
    server: {
        // enable the development server
        enable: true,
    }
})

vroom.db.todo.createMany(
    { title: 'Setup models', completed: true },
    { title: '???', completed: false },
    { title: 'Profit', completed: false }
)
```

To show a list of todos add the FetchList, which will call `/todos` and intercept it

```vue
<template>
    <FetchList model="todo">
        <template #default="{ todoItems }">
            <ul>
                <li :v-for="todo in todoItems" :key="todo.id">
                    {{ todo.title }}
                </li>
            </ul>
        </template>
    </FetchList>
</template>
```
The list above will output:

<ul>
    <li>Setup models</li>
    <li>???</li>
    <li>Profit</li>
</ul>

## Built with <3 by
<VPTeamMembers size="small" :members="members" />
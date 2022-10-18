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

Vroom is a store and api mock generator for Vue.js and Pinia, that let's you
build applications fast and even before backend is ready.

::: tip

Vroom (and it's documentation) is still in alpha, so breaking changes might be
introduced between each minor release.

:::

## How does it work?

Vroom takes a set of model definitions and settings and does a few things:

- Creates a Pinia store for each model, with a set of standard CRUD actions (and
  let you add your own)
- Let's you seed data into your models
- Autogenerates requests to your api
- Creates an interceptor that captures these requests in development and
  responds with your seeded data
- Supply you with simple components to load lists and single items

As Vroom autogenerates both the requests and the mock response you will need a
certain degree of control over the design of the API you interact with to get
any benefit from it. The purpose of the tool is not so much to adapt to existing
api, but rather to discover and describe the needs for one, frontend first if
you will.

## Built with <3 by

<VPTeamMembers size="small" :members="members" />

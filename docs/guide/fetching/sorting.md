# Sorting lists
To sort a list, use the `sort` prop and pass it an array of objects

```vue
<template>
    <FetchList 
        model="monsters" 
        :sort="[{ field: 'challengeRating', dir: 'DESC' }]"
    >
        <template #default="{ monsters }">
            <ul>
                <li v-for="monster in monsters">
                    {{ monster.name }} - {{ monster.challengeRating }}
                </li>
            </ul>
        </template>
        
    </FetchList>
</template>
```
This will append a comma separated sort query param om the API call. Each descending sort field will be prefixed with `-` (e.g. `/monsters/?sort=-challengeRating`):

<ul>
    <li>Tarrasque - 30</li>
    <li>Ancient red dragon - 24</li>
    <li>Ancient gold dragon - 24</li>
    <li>Kraken - 23</li>
    <li>Empyrean - 23</li>
</ul>
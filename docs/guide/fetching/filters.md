# Filtering lists
To filter a list, use the `filter` prop and pass it an object of filters

```vue
<template>
    <FetchList 
        model="monsters" 
        :filter="{ challengeRating: 20 }"
    >
        <template #default="{ monsters }">
            <ul>
                <li v-for="monster in monsters">
                    {{ monster.name }}
                </li>
            </ul>
        </template>
        
    </FetchList>
</template>
```

## Filter operators
Vroom supports a few different filter operators

### Greater or less than
```typescript
// Get items with year <1950 (?year[lt]=1950)
{ year: { lt: 1950 } }

// Get items with year <=1950 (?year[lte]=1950)
{ year: { lte: 1950 } }

// Get items with year >1950 (?year[gt]=1950)
{ year: { gt: 1950 } }

// Get items with year >=1950 (?year[gte]=1950)
{ year: { gte: 1950 } }
```

### Between
```typescript
// Get items with years between 1950 and 2000 (?year[between]=1950,2000)
{ year: { between: [1950, 2000] } }
```

### Contains
```typescript
// Get items where title contains 'the' (?title[contains]=the)
{ title: { contains: 'the' } }
```

## Custom filters
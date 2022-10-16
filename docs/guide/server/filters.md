# Adding custom filters
See [filtering lists](/guide/fetching/filters) for basic filters
```typescript
import vroom from './setup'

export default function addFilters() {
    vroom.server.addFilters({
        book: {
            // Let's do a search that searches in title and author
            search(item, value, db) {
                const author = item.authorId ? db.author.find(item.authorId) : null;
                if (author && author.name.toLowerCase().includes(value.toLowerCase())) {
                    return true;
                }
                return item.title.toLowerCase().includes(value.toLowerCase())
            }
        }
    })
}
```
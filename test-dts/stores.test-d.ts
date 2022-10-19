import { expectType } from '.';
import { createVroom, defineModel } from '.';

const models = {
    book: defineModel({
        schema: {
            title: { type: String },
            isFavourite: { type: Boolean }
        },
        belongsTo: {
            author: () => 'author'
        },
        itemActions: {
            toggleFavourite(item) {
                return { isFavourite: !item.isFavourite }
            }
        }
    }),
    author: defineModel({
        schema: {
            name: { type: String }
        },
        hasMany: {
            books: () => 'book'
        }
    }),
    profile: defineModel({
        schema: {
            name: { type: String }
        },
        singleton: true
    })
}

const vroom = createVroom({
    models
})

type BookType = {
    id: string,
    title: string,
    isFavourite: boolean,
    authorId?: string,
    author?: {
        id: string,
        name: string,
        booksIds?: string[] // Do we need to check this?
    }
}

interface AuthorType {
    id: string,
    name: string,
    booksIds?: string[],
    books?: {
        id: string,
        title: string,
    }[]
}

interface Profile {
    id?: never, // Make sure singletons don't have ids
    name: string
}

expectType<BookType>(vroom.stores.book().items[0])
expectType<AuthorType>(vroom.stores.author().items[0])

vroom.stores.book().create({title: 'Book title'}).then(book => expectType<BookType>(book))
vroom.stores.book().update('1', {title: 'Book title'}).then(book => expectType<BookType>(book))
// @ts-expect-error
vroom.stores.book().update(1, {title: 'Book title'}).then(book => expectType<BookType>(book))

vroom.stores.book().toggleFavourite('1').then(book => expectType<BookType>(book))

expectType<Profile>(vroom.stores.profile().item);
vroom.stores.profile().update({ name: 'New Name' }).then(profile => expectType<Profile>(profile))

// @ts-expect-error
vroom.stores.book().create({ foo: 'bar '})
// @ts-expect-error
vroom.stores.book().update('1', { foo: 'bar '})
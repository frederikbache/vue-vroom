import { expectType } from '.';
import { createVroom, defineModel } from '.';

const models = {
    book: defineModel({
        schema: {
            title: { type: String }
        },
        belongsTo: {
            author: () => 'author'
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
}

const vroom = createVroom({
    models
})

type BookType = {
    id: string,
    title: string,
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

expectType<BookType>(vroom.db.book.items[0])
expectType<AuthorType>(vroom.db.author.items[0])


const vroom2 = createVroom({
    models,
    idsAreNumbers: true
})

type BookTypeInt = {
    id: number,
    title: string,
    authorId?: number,
    author?: {
        id: number,
        name: string,
        booksIds?: number[]
    }
}

interface AuthorTypeInt {
    id: number,
    name: string,
    booksIds?: number[],
    books?: {
        id: number,
        title: string,
    }[]
}

expectType<BookTypeInt>(vroom2.db.book.items[0])
expectType<AuthorTypeInt>(vroom2.db.author.items[0])
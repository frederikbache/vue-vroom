import { beforeEach, describe, expect, it } from 'vitest';
import { createVroom, defineModel } from '.';

const vroom = createVroom({
  models: {
    book: defineModel({
      schema: {
        title: { type: String },
        isFavourite: { type: Boolean },
      },
      belongsTo: {
        author: () => 'author',
      },
      pagination: { type: 'page', defaultLimit: 10 },
      itemActions: {
        toggleFavourite(item) {
          return { isFavourite: !item.isFavourite };
        },
      },
    }),
    author: defineModel({
      schema: {
        name: { type: String },
      },
      pagination: { type: 'cursor', defaultLimit: 10 },
      hasMany: {
        books: () => 'book',
      },
    }),
    foo: defineModel({
      schema: {
        bar: { type: String },
        baz: { type: Number },
        yes: { type: Boolean },
      },
    }),
  },
  server: {
    enable: true,
  },
});

vroom.server?.addFilters({
  foo: {
    even(item) {
      return item.baz % 2 === 0;
    },
  },
});

const post = (url: string, body = {}) =>
  // @ts-expect-error;
  vroom.server?.parseRequest(
    { method: 'POST', url, body: JSON.stringify(body) },
    ''
  );

const patch = (url: string, body = {}) =>
  // @ts-expect-error;
  vroom.server?.parseRequest(
    { method: 'PATCH', url, body: JSON.stringify(body) },
    ''
  );
// @ts-expect-error;
const get = (url) => vroom.server?.parseRequest({ method: 'GET', url }, '');

const destroy = (url: string) =>
  // @ts-expect-error;
  vroom.server?.parseRequest({ method: 'DELETE', url }, '');

describe('CRUD Actions', () => {
  beforeEach(() => {
    vroom.server?.reset();
  });

  it('Can create an item', () => {
    const response = post('/authors', {
      name: 'J.R.R. Tolkien',
    });

    expect(response?.json().id).toBe('1');
    expect(response?.json().name).toBe('J.R.R. Tolkien');
  });

  it('Can get a list of items', () => {
    vroom.db.book.createMany(
      { title: 'The Hobbit' },
      { title: 'The Lord of the Rings', isFavourite: true }
    );
    const response = get('/books');

    expect(response?.json().data).toStrictEqual([
      { id: '1', title: 'The Hobbit', authorId: null, isFavourite: false },
      {
        id: '2',
        title: 'The Lord of the Rings',
        authorId: null,
        isFavourite: true,
      },
    ]);
  });

  it('Can get a single item', () => {
    vroom.db.book.createMany(
      {
        title: 'The Hobbit',
        author: vroom.db.author.create({ name: 'J.R.R. Tolkien' }),
      },
      { title: 'The Lord of the Rings' }
    );
    let response = get('/books/1?include=author');
    expect(response?.json().data).toStrictEqual({
      id: '1',
      title: 'The Hobbit',
      authorId: '1',
      isFavourite: false,
    });
    expect(response?.json().included).toStrictEqual({
      author: [{ id: '1', name: 'J.R.R. Tolkien' }],
    });

    response = get('/books/2');
    expect(response?.json().data).toStrictEqual({
      id: '2',
      title: 'The Lord of the Rings',
      authorId: null,
      isFavourite: false,
    });
  });

  it('Single: 404', () => {
    const response = get('/authors/1');
    expect(response?.ok).toBe(false);
    expect(response?.status).toBe(404);
  });

  it('Can get a list of items', () => {
    vroom.db.author.create({
      name: 'J.R.R. Tolkien',
      books: vroom.db.book.createMany(
        { title: 'The Hobbit' },
        { title: 'The Lord of the Rings' }
      ),
    });
    const response = get('/books?include=author');

    expect(response?.json().data).toStrictEqual([
      { id: '1', title: 'The Hobbit', authorId: '1', isFavourite: false },
      {
        id: '2',
        title: 'The Lord of the Rings',
        authorId: '1',
        isFavourite: false,
      },
    ]);
    expect(response?.json().included).toStrictEqual({
      author: [{ id: '1', name: 'J.R.R. Tolkien' }],
    });
  });

  it('List: pagination', () => {
    vroom.db.book.createMany(
      ...Array(25)
        .fill('a')
        .map(() => ({}))
    );
    vroom.db.author.createMany(
      ...Array(25)
        .fill('a')
        .map(() => ({}))
    );

    let response = get('/books');
    expect(response?.json().data.length).toBe(10);
    expect(response?.json().meta.pages).toBe(3);

    response = get('/books?page=3');
    expect(response?.json().data.length).toBe(5);

    response = get('/books?page=1&limit=20');
    expect(response?.json().data.length).toBe(20);

    response = get('/books?page=2&limit=20');
    expect(response?.json().data.length).toBe(5);

    response = get('/authors');
    expect(response?.json().data.length).toBe(10);
    expect(response?.json().meta.nextCursor).toBe('11');

    response = get('/authors?cursor=11');
    expect(response?.json().data.length).toBe(10);
    expect(response?.json().meta.nextCursor).toBe('21');

    response = get('/authors?cursor=21&limit=2');
    expect(response?.json().data.length).toBe(2);
    expect(response?.json().meta.nextCursor).toBe('23');

    // Invalid cursor
    response = get('/authors?cursor=31');
    expect(response?.ok).toBe(false);
    expect(response?.status).toBe(404);
  });

  it('List: sorting', () => {
    vroom.db.foo.createMany(
      { bar: 'Z', baz: 2 },
      { bar: 'A', baz: 1 },
      { bar: 'B', baz: 2 },
      { bar: 'B', baz: 2 },
      { bar: 'B', baz: 1 },
      { bar: 'A', baz: 2 }
    );

    expect(
      get('/foos?sort=bar,-baz')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['6', '2', '3', '4', '5', '1']);
  });

  it('List: filters', () => {
    vroom.db.foo.createMany(
      { bar: 'ZZZ', baz: 11 },
      { bar: 'yyY', baz: 4, yes: true },
      { bar: 'BBb', baz: 3, yes: false },
      { bar: 'aaa', baz: 20 },
      { bar: 'LLL', baz: 1 },
      { bar: 'aAa', baz: 2 }
    );

    expect(
      get('/foos?baz=4')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['2']);

    expect(
      get('/foos?bar[contains]=a')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['4', '6']);

    expect(
      get('/foos?baz[gt]=3&baz[lte]=11')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['1', '2']);

    expect(
      get('/foos?baz[between]=2,15&bar[lt]=x')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['3']);

    expect(
      get('/foos?bar[between]=b,m')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['3', '5']);

    expect(
      get('/foos?bar[contains]=a&baz[gte]=20')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['4']);

    expect(
      get('/foos?yes=false')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['1', '3', '4', '5', '6']);

    expect(
      get('/foos?yes=true')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['2']);

    expect(
      get('/foos?even')
        ?.json()
        .data.map((item: any) => item.id)
    ).toStrictEqual(['2', '4', '6']);
  });

  it('Can update an item', () => {
    vroom.db.author.create({
      name: 'J.R.R. Tolkien',
    });
    let response = get('/authors/1');
    expect(response?.json().data).toStrictEqual({
      id: '1',
      name: 'J.R.R. Tolkien',
    });

    response = patch('/authors/1', { name: 'Bilbo Baggins' });
    expect(response?.json()).toStrictEqual({
      id: '1',
      name: 'Bilbo Baggins',
    });

    response = get('/authors/1');
    expect(response?.json().data).toStrictEqual({
      id: '1',
      name: 'Bilbo Baggins',
    });
  });

  it('Update: 404', () => {
    const response = patch('/authors/1', {});
    expect(response?.ok).toBe(false);
    expect(response?.status).toBe(404);
  });

  it('Can delete an item', () => {
    vroom.db.book.createMany(
      { title: 'The Hobbit' },
      { title: 'The Lord of the Rings' }
    );

    destroy('/books/1');

    const response = get('/books');

    expect(response?.json().data).toStrictEqual([
      {
        id: '2',
        title: 'The Lord of the Rings',
        authorId: null,
        isFavourite: false,
      },
    ]);
  });

  it('Delete: 404', () => {
    const response = destroy('/authors/1');
    expect(response?.ok).toBe(false);
    expect(response?.status).toBe(404);
  });

  it('Can add an item action', () => {
    vroom.db.book.create({ title: 'The Hobbit', isFavourite: true });

    const response = post('/books/1/toggleFavourite');
    expect(response?.json()).toStrictEqual({
      id: '1',
      title: 'The Hobbit',
      isFavourite: false,
      authorId: null,
    });
  });

  it('Item action: 404', () => {
    const response = post('/books/1/toggleFavourite');
    expect(response?.ok).toBe(false);
    expect(response?.status).toBe(404);
  });
});

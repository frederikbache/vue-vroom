import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const mock = {
  handleIndexSideEffect(items: any) {
    return items;
  },
  handleCreateSideEffect(item: any) {
    return { ...item, title: item.title + ' is a good book' };
  },
  handleUpdateSideEffect(item: any) {
    return { ...item, title: item.title + ' was edited' };
  },
  handleSimpleSideEffect(item: any) {
    return item;
  },
};

const indexSpy = vi.spyOn(mock, 'handleIndexSideEffect');
const createSpy = vi.spyOn(mock, 'handleCreateSideEffect');
const updateSpy = vi.spyOn(mock, 'handleUpdateSideEffect');
const simpleSpy = vi.spyOn(mock, 'handleSimpleSideEffect');

vroom.server?.addSideEffects({
  book: {
    index: mock.handleIndexSideEffect,
    create: mock.handleCreateSideEffect,
    update: mock.handleUpdateSideEffect,
    read: mock.handleSimpleSideEffect,
    delete: mock.handleSimpleSideEffect,
    /* create: mock.handleSideEffect,
    read: mock.handleSideEffect,
    update: mock.handleSideEffect,
    delete: mock.handleSideEffect, */
  },
});

const post = (url: string, body = {}) =>
  // @ts-expect-error;
  vroom.server?.parseRequest(
    { method: 'POST', url, body: JSON.stringify(body), headers: {} },
    ''
  );

const patch = (url: string, body = {}) =>
  // @ts-expect-error;
  vroom.server?.parseRequest(
    { method: 'PATCH', url, body: JSON.stringify(body), headers: {} },
    ''
  );
// @ts-expect-error;
const get = (url) =>
  vroom.server?.parseRequest({ method: 'GET', url, headers: {} }, '');

const destroy = (url: string, body: any = undefined) =>
  // @ts-expect-error;
  vroom.server?.parseRequest(
    {
      method: 'DELETE',
      url,
      body: body ? JSON.stringify(body) : undefined,
      headers: {},
    },
    ''
  );

describe('CRUD Actions', () => {
  beforeEach(() => {
    vroom.server?.reset();
  });

  it('Can create an item', async () => {
    const response = await vroom.api.post('/authors', {
      name: 'J.R.R. Tolkien',
    });

    expect(response.id).toBe('1');
    expect(response.name).toBe('J.R.R. Tolkien');
  });

  it('Can get a list of items', async () => {
    vroom.db.book.createMany(
      { title: 'The Hobbit' },
      { title: 'The Lord of the Rings', isFavourite: true }
    );
    const response = await vroom.api.get('/books');

    expect(response.data).toStrictEqual([
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
      { title: 'The Lord of the Rings' },
      { title: 'The Hobbit' }
    );

    destroy('/books/2');

    const response = get('/books');

    expect(response?.json().data).toStrictEqual([
      {
        id: '1',
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

  it('Can bulk create', () => {
    const response = post('/authors/bulk', [
      { name: 'J.R.R. Tolkien' },
      { name: 'George R.R. Martin' },
    ]);

    expect(response?.json().length).toBe(2);
    expect(response?.json()[0].id).toBe('1');
    expect(response?.json()[0].name).toBe('J.R.R. Tolkien');
    expect(response?.json()[1].id).toBe('2');
    expect(response?.json()[1].name).toBe('George R.R. Martin');
  });

  it('Can bulk update', () => {
    vroom.db.book.createMany(
      {
        title: 'The Hobbit',
      },
      { title: 'The Lord of the Rings' }
    );
    vroom.db.author.create({ name: 'J.R.R. Tolkien' });

    const response = patch('/books/bulk', [
      { id: '1', authorId: '1' },
      { id: '2', authorId: '1' },
    ]);

    expect(response?.json().length).toBe(2);
    expect(response?.json()[0].id).toBe('1');
    expect(response?.json()[0].authorId).toBe('1');
    expect(response?.json()[1].id).toBe('2');
    expect(response?.json()[1].authorId).toBe('1');
  });

  it('Can bulk delete', () => {
    vroom.db.book.createMany(
      { title: 'The Lord of the Rings' },
      { title: 'The Hobbit' }
    );

    destroy('/books/bulk', [{ id: '1' }, { id: '2' }]);

    const response = get('/books');

    expect(response?.json().data).toStrictEqual([]);
  });

  it('Side effect: index', () => {
    vroom.db.book.createMany(
      { title: 'The Lord of the Rings' },
      { title: 'The Hobbit' }
    );

    indexSpy.mockClear();

    get('/books');

    expect(indexSpy).toBeCalledTimes(1);
    expect(indexSpy).toHaveLastReturnedWith([
      {
        authorId: null,
        id: '1',
        isFavourite: false,
        title: 'The Lord of the Rings',
      },
      { authorId: null, id: '2', isFavourite: false, title: 'The Hobbit' },
    ]);
  });

  it('Side effects: create', () => {
    createSpy.mockClear();

    post('/books', {
      title: 'Silmarillion',
    });

    expect(createSpy).toBeCalledTimes(1);
    expect(createSpy).toHaveLastReturnedWith({
      authorId: null,
      id: '1',
      isFavourite: false,
      title: 'Silmarillion is a good book',
    });
  });

  it('Side effects: read', () => {
    vroom.db.book.createMany({ title: 'The Lord of the Rings' });

    simpleSpy.mockClear();

    get('/books/1');

    expect(simpleSpy).toBeCalledTimes(1);
    expect(simpleSpy).toHaveLastReturnedWith({
      authorId: null,
      id: '1',
      isFavourite: false,
      title: 'The Lord of the Rings',
    });
  });

  it('Side effects: update', () => {
    vroom.db.book.createMany({ title: 'The Lord of the Rings' });

    updateSpy.mockClear();

    patch('/books/1', {
      isFavourite: true,
    });

    expect(updateSpy).toBeCalledTimes(1);
    expect(updateSpy).toHaveLastReturnedWith({
      authorId: null,
      id: '1',
      isFavourite: true,
      title: 'The Lord of the Rings was edited',
    });
  });

  it('Side effects: delete', () => {
    vroom.db.book.createMany({ title: 'The Lord of the Rings' });

    simpleSpy.mockClear();

    destroy('/books/1');

    expect(simpleSpy).toBeCalledTimes(1);
    expect(simpleSpy).toHaveLastReturnedWith({
      authorId: null,
      id: '1',
      isFavourite: false,
      title: 'The Lord of the Rings',
    });
  });
});

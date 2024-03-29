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
    delay: 0,
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
  },
});

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

  it('Can get a single item', async () => {
    vroom.db.book.createMany(
      {
        title: 'The Hobbit',
        author: vroom.db.author.create({ name: 'J.R.R. Tolkien' }),
      },
      { title: 'The Lord of the Rings' }
    );
    let response = await vroom.api.get('/books/1?include=author');
    expect(response.data).toStrictEqual({
      id: '1',
      title: 'The Hobbit',
      authorId: '1',
      isFavourite: false,
    });
    expect(response.included).toStrictEqual({
      author: [{ id: '1', name: 'J.R.R. Tolkien' }],
    });

    response = await vroom.api.get('/books/2');
    expect(response.data).toStrictEqual({
      id: '2',
      title: 'The Lord of the Rings',
      authorId: null,
      isFavourite: false,
    });
  });

  it('Single: 404', async () => {
    await expect(() => vroom.api.get('/authors/1')).rejects.toThrowError();
  });

  it('Can get a list of items', async () => {
    vroom.db.author.create({
      name: 'J.R.R. Tolkien',
      books: vroom.db.book.createMany(
        { title: 'The Hobbit' },
        { title: 'The Lord of the Rings' }
      ),
    });
    const response = await vroom.api.get('/books?include=author');

    expect(response.data).toStrictEqual([
      { id: '1', title: 'The Hobbit', authorId: '1', isFavourite: false },
      {
        id: '2',
        title: 'The Lord of the Rings',
        authorId: '1',
        isFavourite: false,
      },
    ]);
    expect(response.included).toStrictEqual({
      author: [{ id: '1', name: 'J.R.R. Tolkien' }],
    });
  });

  it('List: pagination', async () => {
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

    let response = await vroom.api.get('/books');
    expect(response.data.length).toBe(10);
    expect(response.meta.pages).toBe(3);

    response = await vroom.api.get('/books?page=3');
    expect(response.data.length).toBe(5);

    response = await vroom.api.get('/books?page=1&limit=20');
    expect(response.data.length).toBe(20);

    response = await vroom.api.get('/books?page=2&limit=20');
    expect(response.data.length).toBe(5);

    response = await vroom.api.get('/authors');
    expect(response.data.length).toBe(10);
    expect(response.meta.nextCursor).toBe('11');

    response = await vroom.api.get('/authors?cursor=11');
    expect(response.data.length).toBe(10);
    expect(response.meta.nextCursor).toBe('21');

    response = await vroom.api.get('/authors?cursor=21&limit=2');
    expect(response.data.length).toBe(2);
    expect(response.meta.nextCursor).toBe('23');

    // Invalid cursor
    await expect(() =>
      vroom.api.get('/authors?cursor=31')
    ).rejects.toThrowError();
  });

  it('List: sorting', async () => {
    vroom.db.foo.createMany(
      { bar: 'Z', baz: 2 },
      { bar: 'A', baz: 1 },
      { bar: 'B', baz: 2 },
      { bar: 'B', baz: 2 },
      { bar: 'B', baz: 1 },
      { bar: 'A', baz: 2 }
    );

    const response = await vroom.api.get('/foos?sort=bar,-baz');

    expect(response.data.map((item: any) => item.id)).toStrictEqual([
      '6',
      '2',
      '3',
      '4',
      '5',
      '1',
    ]);
  });

  it('List: filters', async () => {
    vroom.db.foo.createMany(
      { bar: 'ZZZ', baz: 11 },
      { bar: 'yyY', baz: 4, yes: true },
      { bar: 'BBb', baz: 3, yes: false },
      { bar: 'aaa', baz: 20 },
      { bar: 'LLL', baz: 1 },
      { bar: 'aAa', baz: 2 }
    );

    let response = await vroom.api.get('/foos?baz=4');
    expect(response.data.map((item: any) => item.id)).toStrictEqual(['2']);

    response = await vroom.api.get('/foos?bar[contains]=a');
    expect(response.data.map((item: any) => item.id)).toStrictEqual(['4', '6']);

    response = await vroom.api.get('/foos?baz[gt]=3&baz[lte]=11');
    expect(response.data.map((item: any) => item.id)).toStrictEqual(['1', '2']);

    response = await vroom.api.get('/foos?baz[between]=2,15&bar[lt]=x');
    expect(response.data.map((item: any) => item.id)).toStrictEqual(['3']);

    response = await vroom.api.get('/foos?bar[between]=b,m');
    expect(response.data.map((item: any) => item.id)).toStrictEqual(['3', '5']);

    response = await vroom.api.get('/foos?bar[contains]=a&baz[gte]=20');
    expect(response.data.map((item: any) => item.id)).toStrictEqual(['4']);

    response = await vroom.api.get('/foos?yes=false');
    expect(response.data.map((item: any) => item.id)).toStrictEqual([
      '1',
      '3',
      '4',
      '5',
      '6',
    ]);

    response = await vroom.api.get('/foos?yes=true');
    expect(response.data.map((item: any) => item.id)).toStrictEqual(['2']);

    response = await vroom.api.get('/foos?even');
    expect(response.data.map((item: any) => item.id)).toStrictEqual([
      '2',
      '4',
      '6',
    ]);
  });

  it('Can update an item', async () => {
    vroom.db.author.create({
      name: 'J.R.R. Tolkien',
    });
    let response = await vroom.api.get('/authors/1');
    expect(response.data).toStrictEqual({
      id: '1',
      name: 'J.R.R. Tolkien',
    });

    response = await vroom.api.patch('/authors/1', { name: 'Bilbo Baggins' });
    expect(response).toStrictEqual({
      id: '1',
      name: 'Bilbo Baggins',
    });

    response = await vroom.api.get('/authors/1');
    expect(response.data).toStrictEqual({
      id: '1',
      name: 'Bilbo Baggins',
    });
  });

  it('Update: 404', async () => {
    await expect(() =>
      vroom.api.patch('/authors/1', {})
    ).rejects.toThrowError();
  });

  it('Can delete an item', async () => {
    vroom.db.book.createMany(
      { title: 'The Lord of the Rings' },
      { title: 'The Hobbit' }
    );

    await vroom.api.delete('/books/2');

    const response = await vroom.api.get('/books');

    expect(response.data).toStrictEqual([
      {
        id: '1',
        title: 'The Lord of the Rings',
        authorId: null,
        isFavourite: false,
      },
    ]);
  });

  it('Delete: 404', async () => {
    await expect(() => vroom.api.delete('/authors/1')).rejects.toThrowError();
  });

  it('Can add an item action', async () => {
    vroom.db.book.create({ title: 'The Hobbit', isFavourite: true });

    const response = await vroom.api.post('/books/1/toggleFavourite');
    expect(response).toStrictEqual({
      id: '1',
      title: 'The Hobbit',
      isFavourite: false,
      authorId: null,
    });
  });

  it('Item action: 404', async () => {
    await expect(() =>
      vroom.api.post('/books/1/toggleFavourite')
    ).rejects.toThrowError();
  });

  it('Can bulk create', async () => {
    const response = await vroom.api.post('/authors/bulk', [
      { name: 'J.R.R. Tolkien' },
      { name: 'George R.R. Martin' },
    ]);

    expect(response.length).toBe(2);
    expect(response[0].id).toBe('1');
    expect(response[0].name).toBe('J.R.R. Tolkien');
    expect(response[1].id).toBe('2');
    expect(response[1].name).toBe('George R.R. Martin');
  });

  it('Can bulk update', async () => {
    vroom.db.book.createMany(
      {
        title: 'The Hobbit',
      },
      { title: 'The Lord of the Rings' }
    );
    vroom.db.author.create({ name: 'J.R.R. Tolkien' });

    const response = await vroom.api.patch('/books/bulk', [
      { id: '1', authorId: '1' },
      { id: '2', authorId: '1' },
    ]);

    expect(response.length).toBe(2);
    expect(response[0].id).toBe('1');
    expect(response[0].authorId).toBe('1');
    expect(response[1].id).toBe('2');
    expect(response[1].authorId).toBe('1');
  });

  it('Can bulk delete', async () => {
    vroom.db.book.createMany(
      { title: 'The Lord of the Rings' },
      { title: 'The Hobbit' }
    );

    await vroom.api.delete('/books/bulk', [{ id: '1' }, { id: '2' }]);

    const response = await vroom.api.get('/books');

    expect(response.data).toStrictEqual([]);
  });

  it('Side effect: index', async () => {
    vroom.db.book.createMany(
      { title: 'The Lord of the Rings' },
      { title: 'The Hobbit' }
    );

    indexSpy.mockClear();

    await vroom.api.get('/books');

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

  it('Side effects: create', async () => {
    createSpy.mockClear();

    await vroom.api.post('/books', {
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

  it('Side effects: read', async () => {
    vroom.db.book.createMany({ title: 'The Lord of the Rings' });

    simpleSpy.mockClear();

    await vroom.api.get('/books/1');

    expect(simpleSpy).toBeCalledTimes(1);
    expect(simpleSpy).toHaveLastReturnedWith({
      authorId: null,
      id: '1',
      isFavourite: false,
      title: 'The Lord of the Rings',
    });
  });

  it('Side effects: update', async () => {
    vroom.db.book.createMany({ title: 'The Lord of the Rings' });

    updateSpy.mockClear();

    await vroom.api.patch('/books/1', {
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

  it('Side effects: delete', async () => {
    vroom.db.book.createMany({ title: 'The Lord of the Rings' });

    simpleSpy.mockClear();

    await vroom.api.delete('/books/1');

    expect(simpleSpy).toBeCalledTimes(1);
    expect(simpleSpy).toHaveLastReturnedWith({
      authorId: null,
      id: '1',
      isFavourite: false,
      title: 'The Lord of the Rings',
    });
  });
});

import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { createVroom, defineModel } from '.';

const app = createApp({});

const vroom = createVroom({
  models: {
    book: defineModel({
      schema: {
        title: { type: String },
      },
    }),
  },
  server: {
    enable: false,
  },
});

app.use(createPinia());
app.use(vroom);

const mockFetch = vi.fn(() => Promise.resolve({ ok: true, json: () => {} }));
// @ts-expect-error;
global.fetch = mockFetch;
const spy = vi.spyOn(global, 'fetch');

describe('Stores', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Can fetch a list', () => {
    vroom.stores
      .book()
      // @ts-expect-error
      .$list({}, {}, [], [])
      .catch(() => {});

    expect(spy).toHaveBeenCalledWith('/books', {
      method: 'GET',
      body: undefined,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('List: filter', () => {
    vroom.stores
      .book()
      // @ts-expect-error
      .$list({ foo: 'bar', baz: { gte: 10 } }, {}, [], [])
      .catch(() => {});
    expect(spy).toHaveBeenCalledWith(
      '/books?' + encodeURI('foo=bar&baz[gte]=10'),
      {
        method: 'GET',
        body: undefined,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('List: pagination', () => {
    vroom.stores
      .book()
      // @ts-expect-error
      .$list({}, { page: 1, limit: 10 }, [], [])
      .catch(() => {});
    expect(spy).toHaveBeenCalledWith('/books?page=1&limit=10', {
      method: 'GET',
      body: undefined,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('List: sort', () => {
    vroom.stores
      .book()
      .$list(
        {},
        {},
        // @ts-expect-error
        [
          { field: 'year', dir: 'ASC' },
          { field: 'rating', dir: 'DESC' },
        ],
        []
      )
      .catch(() => {});
    expect(spy).toHaveBeenCalledWith(
      '/books?sort=' + encodeURIComponent('year,-rating'),
      {
        method: 'GET',
        body: undefined,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('List: include', () => {
    vroom.stores
      .book()
      // @ts-expect-error
      .$list({}, {}, [], ['author', 'publisher'])
      .catch(() => {});
    expect(spy).toHaveBeenCalledWith(
      '/books?include=' + encodeURIComponent('author,publisher'),
      {
        method: 'GET',
        body: undefined,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Can create an item', () => {
    vroom.stores.book().create({
      title: 'The Hobbit',
    });

    expect(spy).toHaveBeenCalledWith('/books', {
      method: 'POST',
      body: JSON.stringify({ title: 'The Hobbit' }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Can update an item', () => {
    vroom.db.book.create({});

    vroom.stores
      .book()
      .update('1', {
        title: 'The Hobbit',
      })
      .catch(() => {});

    expect(spy).toHaveBeenCalledWith('/books/1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'The Hobbit' }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Can delete an item', () => {
    vroom.db.book.create({});

    vroom.stores
      .book()
      .delete('1')
      .catch(() => {});

    expect(spy).toHaveBeenCalledWith('/books/1', {
      method: 'DELETE',
      body: undefined,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Can bulk create', () => {
    vroom.stores
      .book()
      .bulkCreate([{ title: 'Lord of the Rings' }, { title: 'The Hobbit' }])
      .catch(() => {});

    expect(spy).toHaveBeenCalledWith('/books/bulk', {
      method: 'POST',
      body: JSON.stringify([
        { title: 'Lord of the Rings' },
        { title: 'The Hobbit' },
      ]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('Can bulk update', () => {
    vroom.stores
      .book()
      .bulkUpdate([
        { id: '1', title: 'Lord of the Rings' },
        { id: '2', title: 'The Hobbit' },
      ])
      .catch(() => {});

    expect(spy).toHaveBeenCalledWith('/books/bulk', {
      method: 'PATCH',
      body: JSON.stringify([
        { id: '1', title: 'Lord of the Rings' },
        { id: '2', title: 'The Hobbit' },
      ]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('Can bulk delete', () => {
    vroom.stores
      .book()
      .bulkDelete(['2', '1'])
      .catch(() => {});

    expect(spy).toHaveBeenCalledWith('/books/bulk', {
      method: 'DELETE',
      body: JSON.stringify([{ id: '2' }, { id: '1' }]),
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

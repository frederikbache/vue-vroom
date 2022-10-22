import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import FetchList from '../src/FetchList.vue';
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia } from 'pinia';

const app = createApp({});
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
  },
  server: {
    enable: true,
  },
});

app.use(createPinia());
const res = app.use(vroom);

const mockFetch = vi.fn((...args) => {
  const [url, config] = args;

  return Promise.resolve(
    // @ts-expect-error
    vroom.server.parseRequest(
      {
        method: config.method,
        url,
        body: config.body,
      },
      ''
    )
  );
});
// @ts-expect-error;
global.fetch = mockFetch;
const spy = vi.spyOn(global, 'fetch');

describe('FetchList.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vroom.cache().ids = {};
    vroom.server?.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Basic fetch', async () => {
    vroom.db.book.createMany(
      { title: 'The Hobbit' },
      { title: 'The Lord of the Rings' }
    );
    const wrapper = mount(FetchList, {
      props: { model: 'book' },
      global: {
        provide: res._context.provides,
      },
    });

    await flushPromises();

    expect(vroom.cache().ids.book).toStrictEqual({
      '1': 1,
      '2': 1,
    });
    expect(vroom.stores.book().items.length).toBe(2);

    await wrapper.setProps({ filter: { title: { contains: 'Hobbit' } } });
    await flushPromises();

    expect(vroom.cache().ids.book).toStrictEqual({ '1': 1, '2': 0 });

    vi.runAllTimers();
    expect(vroom.cache().ids.book).toStrictEqual({ '1': 1 });
    expect(vroom.stores.book().items.length).toBe(1);
  });

  it('Includes', async () => {
    vroom.db.author.create({
      name: 'JRR Tolkien',
      books: vroom.db.book.createMany(
        { title: 'The Hobbit' },
        { title: 'The Lord of the Rings' }
      ),
    });
    const wrapper = mount(FetchList, {
      props: { model: 'author', include: ['books'] },
      global: {
        provide: res._context.provides,
      },
    });

    // @ts-expect-error
    const { refresh } = wrapper.emitted('ready')[0][0];

    await flushPromises();

    expect(vroom.cache().ids.book).toStrictEqual({ '1': 1, '2': 1 });
    expect(vroom.cache().ids.author).toStrictEqual({ '1': 1 });

    await vroom.stores.book().create({ title: 'Silmarillion', authorId: '1' });
    refresh();
    await flushPromises();

    expect(vroom.cache().ids.book).toStrictEqual({ '1': 1, '2': 1, '3': 1 });
    expect(vroom.cache().ids.author).toStrictEqual({ '1': 1 });
  });
});

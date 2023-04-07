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
    delay: 0,
  },
});

app.use(createPinia());
const res = app.use(vroom);

describe('FetchList.vue', () => {
  beforeEach(() => {
    vroom.cache().ids = {};
    vroom.server?.reset();
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

    await new Promise((r) => setTimeout(r, 1));

    expect(vroom.cache().ids.book).toStrictEqual({
      '1': 1,
      '2': 1,
    });
    expect(vroom.stores.book().items.length).toBe(2);

    await wrapper.setProps({ filter: { title: { contains: 'Hobbit' } } });
    await new Promise((r) => setTimeout(r, 1));

    expect(vroom.cache().ids.book).toStrictEqual({ '1': 1, '2': 0 });
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

    await new Promise((r) => setTimeout(r, 1));

    expect(vroom.cache().ids.book).toStrictEqual({ '1': 1, '2': 1 });
    expect(vroom.cache().ids.author).toStrictEqual({ '1': 1 });

    // Add and refresh
    await vroom.stores.book().create({ title: 'Silmarillion', authorId: '1' });
    refresh();
    await new Promise((r) => setTimeout(r, 1));

    expect(vroom.cache().ids.book).toStrictEqual({ '1': 1, '2': 1, '3': 1 });
    expect(vroom.cache().ids.author).toStrictEqual({ '1': 1 });

    // Add and local update
    const tales = await vroom.stores
      .book()
      .create({ title: 'Unfinished tales', authorId: '1' });
    const author = vroom.stores.author().single('1');
    vroom.stores.author().localUpdate('1', {
      booksIds: [...(author.booksIds || []), tales.id],
    });

    await new Promise((r) => setTimeout(r, 1));

    expect(vroom.cache().ids.book).toStrictEqual({
      '1': 1,
      '2': 1,
      '3': 1,
      '4': 1,
    });
  });
});

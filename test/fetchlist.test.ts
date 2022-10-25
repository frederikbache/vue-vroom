import { mount, flushPromises } from '@vue/test-utils';
import { createVroom, defineModel } from '.';
import FetchList from '../src/FetchList.vue';
import { beforeEach, describe, it, expect, vi } from 'vitest';
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
      slots: {
        default: `<template #default="{bookItems}">
            <p v-for="book in bookItems">{{ book.id }} - {{ book.title }}</p>
        </template>`,
      },
    });

    expect(spy).toHaveBeenCalledWith('/books', {
      method: 'GET',
      body: undefined,
      headers: {},
    });

    expect(spy).toHaveBeenCalledTimes(1);

    await flushPromises();

    const book = wrapper.findAll('p');
    expect(book.length).toBe(2);
    expect(book[0].text()).toBe('1 - The Hobbit');
    expect(book[1].text()).toBe('2 - The Lord of the Rings');
  });

  it('Loads included items', async () => {
    vroom.db.author.create({
      name: 'JRR Tolkien',
      books: vroom.db.book.createMany(
        { title: 'The Hobbit' },
        { title: 'The Lord of the Rings' }
      ),
    });

    const bookList = mount(FetchList, {
      props: { model: 'book', include: ['author'] },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{bookItems}">
              <p v-for="book in bookItems">{{ book.id }} - {{ book.title }} - {{ book.author?.name }}</p>
          </template>`,
      },
    });

    await flushPromises();

    const book = bookList.findAll('p');
    expect(book[0].text()).toBe('1 - The Hobbit - JRR Tolkien');
    expect(book[1].text()).toBe('2 - The Lord of the Rings - JRR Tolkien');

    const authorList = mount(FetchList, {
      props: { model: 'author', include: ['books'] },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{authorItems}">
                    <div v-for="author in authorItems">
                        <p>{{ author.id }} - {{ author.name }}</p>
                        <span v-for="book in author.books">{{ book.title }}</span>
                    </div>
                </template>`,
      },
    });

    await flushPromises();

    const author = authorList.findAll('p');
    const authorBooks = authorList.findAll('span');
    expect(author[0].text()).toBe('1 - JRR Tolkien');
    expect(authorBooks[0].text()).toBe('The Hobbit');
    expect(authorBooks[1].text()).toBe('The Lord of the Rings');
  });

  it('Push ID', async () => {
    vroom.db.book.createMany({ title: 'The Hobbit' });
    const wrapper = mount(FetchList, {
      props: { model: 'book' },
      global: {
        provide: res._context.provides,
      },
      slots: {
        default: `<template #default="{bookItems}">
                    <p v-for="book in bookItems">{{ book.id }} - {{ book.title }}</p>
                </template>`,
      },
    });

    // @ts-expect-error
    const { pushId } = wrapper.emitted('ready')[0][0];

    await flushPromises();

    let book = wrapper.findAll('p');
    expect(book.length).toBe(1);
    expect(book[0].text()).toBe('1 - The Hobbit');

    const { id } = await vroom.stores.book().create({ title: 'Silmarillion' });
    pushId(id);

    await flushPromises();

    book = wrapper.findAll('p');
    expect(book.length).toBe(2);
    expect(book[1].text()).toBe('2 - Silmarillion');
  });

  it('Custom path', () => {
    mount(FetchList, {
      props: { model: 'book', path: '/some-other-path' },
      global: {
        provide: res._context.provides,
      },
    });

    expect(spy).toHaveBeenCalledWith('/some-other-path', {
      method: 'GET',
      body: undefined,
      headers: {},
    });
  });
});
